import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
	applySelectedAlgorithm,
	fitGraphToViewport,
	hideGraphContainer,
	indexAndRefreshGraph,
	onNodesRemove,
	onNodesUpdate,
	onRelationsRemove,
	onRelationsUpdate,
	showGraphContainer
} from 'src/components/network-graph/helpers';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';
import { useNotificationsStore } from 'src/stores/notifications';
import { useSearchStore } from 'src/stores/search';
import { useSettingsStore } from 'src/stores/settings';
import {
	GRAPH_DEFAULT_LABEL_DARK_COLOR,
	GRAPH_DEFAULT_LABEL_LIGHT_COLOR
} from 'src/utils/constants';
import { isNonPseudoNode } from 'src/utils/helpers/nodes';

// TODO check all modules, plugins and other functionalities tied to graph for unnecessary re-renderings
export const LoadGraph = () => {
	const {
		unHighlightNodes,
		unHighlightRelations,
		addNode,
		addRelation,
		setIsGraphRendered,
		sigma
	} = useGraphStore((store) => store);
	const {
		getStoreNode,
		getStoreRelation,
		addEventListener,
		removeEventListener,
		nodes,
		relations
	} = useItemsStore((store) => store);
	const algorithm = useSearchStore((store) => store.algorithm);
	const theme = useSettingsStore((store) => store.theme);
	const addNotification = useNotificationsStore((store) => store.addNotification);
	const { t } = useTranslation();

	useEffect(() => {
		const disableAutoscale = () => {
			// Disable autoscale at the first down interaction
			if (!sigma.getCustomBBox()) {
				sigma.setCustomBBox(sigma.getBBox());
			}
		};

		sigma.getMouseCaptor().addListener('mousedown', disableAutoscale);
		sigma.addListener('downStage', unHighlightNodes);
		sigma.addListener('downStage', unHighlightRelations);

		return () => {
			setIsGraphRendered(false);
			sigma.getMouseCaptor().removeListener('mousedown', disableAutoscale);
			sigma.removeListener('downStage', unHighlightNodes);
			sigma.removeListener('downStage', unHighlightRelations);
		};
	}, []);

	// observe node and relation changes
	useEffect(() => {
		addEventListener('onNodesUpdate', onNodesUpdate);
		addEventListener('onNodesRemove', onNodesRemove);
		addEventListener('onRelationsUpdate', onRelationsUpdate);
		addEventListener('onRelationsRemove', onRelationsRemove);

		return () => {
			removeEventListener('onNodesUpdate', onNodesUpdate);
			removeEventListener('onNodesRemove', onNodesRemove);
			removeEventListener('onRelationsUpdate', onRelationsUpdate);
			removeEventListener('onRelationsRemove', onRelationsRemove);
		};
	}, [sigma]);

	useEffect(() => {
		hideGraphContainer();

		// clear sigma and its graph
		sigma.clear();
		sigma.getGraph().clear();

		if (!nodes.size) {
			addNotification({
				title: t('notifications_info_graph_no_nodes'),
				type: 'informational'
			});

			return;
		}

		// add nodes
		nodes.forEach((node) => {
			const storeNode = getStoreNode(node.id);

			if (isNonPseudoNode(storeNode)) {
				addNode(storeNode);
			}
		});

		// add relations
		relations.forEach((relation) => {
			const storeRelation = getStoreRelation(relation.id);

			if (storeRelation) {
				const sourceNode = getStoreNode(storeRelation.source_id);
				const targetNode = getStoreNode(storeRelation.target_id);

				if (sourceNode && targetNode) {
					addRelation(storeRelation);
				}
			}
		});

		indexAndRefreshGraph();

		const needToSubscribeToAfterRender = applySelectedAlgorithm();

		if (needToSubscribeToAfterRender) {
			sigma.once('afterRender', fitGraph);
		} else {
			fitGraph();
		}
	}, [algorithm]);

	useEffect(() => {
		sigma.setSetting('labelColor', { color: labelColor() });
	}, [theme]);

	const fitGraph = () => {
		const { cameraStateChanged } = fitGraphToViewport(sigma, sigma.getGraph().nodes());

		if (cameraStateChanged) {
			sigma.once('afterRender', fitGraphCallback);
		} else {
			fitGraphCallback();
		}
	};

	const fitGraphCallback = () => {
		showGraphContainer();
		setIsGraphRendered(true);
	};

	const labelColor = () => {
		if (theme === 'light') {
			return GRAPH_DEFAULT_LABEL_DARK_COLOR;
		}

		return GRAPH_DEFAULT_LABEL_LIGHT_COLOR;
	};

	return null;
};
