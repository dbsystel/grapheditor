import { processResult } from 'src/components/main-visual/helpers';
import i18n from 'src/i18n';
import { useItemsStore } from 'src/stores/items';
import { useNotificationsStore } from 'src/stores/notifications';
import { useParallaxStore } from 'src/stores/parallax';
import { SearchStoreResult, useSearchStore } from 'src/stores/search';
import { useSettingsStore } from 'src/stores/settings';
import { parallaxApi } from 'src/utils/api/parallax';
import { relationsApi } from 'src/utils/api/relations';
import {
	GRAPH_LAYOUT_NOVERLAP,
	GRAPH_PRESENTATION_GRAPH,
	GRAPH_PRESENTATION_RESULT_TABLE
} from 'src/utils/constants';

const searchStoreResultObserver = async (result: SearchStoreResult) => {
	useSearchStore.getState().setIsResultProcessed(false);

	if (result.data) {
		const { nodesMap, relationsMap } = processResult(result.data);

		if (result.type !== 'parallax') {
			useParallaxStore.getState().reset();

			parallaxApi
				.postParallax({
					nodeIds: nodesMap.keys().toArray(),
					filters: { labels: [], properties: {} },
					steps: []
				})
				.then((response) => {
					useParallaxStore.getState().setInitialQuery({
						filters: { labels: [], properties: {} },
						nodeIds: nodesMap.keys().toArray()
					});
					useParallaxStore.getState().setParallaxData(response.data);
				});
		}

		if (nodesMap.size) {
			if (useSettingsStore.getState().isAutoconnectEnabled) {
				const response = await relationsApi.postRelationsByNodeIds({
					additionalNodeIds: Array.from(nodesMap.keys())
				});

				response.data.forEach((relation) => {
					if (!relationsMap.has(relation.id)) {
						relationsMap.set(relation.id, relation);
					}
				});
			}
		}

		if (
			useSearchStore.getState().presentation === GRAPH_PRESENTATION_GRAPH &&
			!nodesMap.size &&
			result.data.length > 0
		) {
			useSearchStore.getState().setPresentation(GRAPH_PRESENTATION_RESULT_TABLE);
			useNotificationsStore.getState().addNotification({
				title: i18n.t('notifications_info_graph_no_nodes_switch_presentation_to_table'),
				type: 'informational'
			});
		}

		if (!relationsMap.size) {
			useSearchStore.getState().setAlgorithm(GRAPH_LAYOUT_NOVERLAP);
		}

		useItemsStore.getState().clearNodes(true);
		useItemsStore.getState().clearRelations(true);
		useItemsStore.getState().setNodes(nodesMap.values().toArray());
		useItemsStore.getState().setRelations(relationsMap.values().toArray());

		useSearchStore.getState().setIsResultProcessed(true);
	}
};

export const initializeSearchStoreObservers = () => {
	const unsubscribeSearchStoreResultObserver = useSearchStore.subscribe(
		(store) => store.result,
		searchStoreResultObserver
	);

	return {
		result: unsubscribeSearchStoreResultObserver
	};
};
