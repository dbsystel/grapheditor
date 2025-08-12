import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
	fitGraphToViewport,
	hideGraphContainer,
	onNodesRemove,
	onNodesUpdate,
	onRelationsRemove,
	onRelationsUpdate,
	showGraphContainer
} from 'src/components/network-graph/helpers';
import { assignForceLayout } from 'src/components/network-graph/layouts/force';
import { assignForceAtlas2Layout } from 'src/components/network-graph/layouts/forceAtlas2';
import { assignNoverlapLayout } from 'src/components/network-graph/layouts/noverlap';
import { assignRandomLayout } from 'src/components/network-graph/layouts/random';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';
import { useNotificationsStore } from 'src/stores/notifications';
import { useSearchStore } from 'src/stores/search';
import { useSettingsStore } from 'src/stores/settings';
import {
	GRAPH_DEFAULT_LABEL_DARK_COLOR,
	GRAPH_DEFAULT_LABEL_LIGHT_COLOR,
	GRAPH_LAYOUT_FORCE,
	GRAPH_LAYOUT_FORCE_ATLAS_2,
	GRAPH_LAYOUT_NOVERLAP,
	GRAPH_LAYOUT_RANDOM
} from 'src/utils/constants';
import { isNonPseudoNode } from 'src/utils/helpers/nodes';

// TODO check all modules, plugins and other functionalities tied to graph for unnecessary re-renderings
export const LoadGraph = () => {
	const {
		unHighlightNodes,
		unHighlightRelations,
		adaptRelationsTypeAndCurvature,
		indexParallelRelations,
		addNode,
		addRelation,
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
	const { algorithm } = useSearchStore((store) => store);
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

		// prepare relation parallel edges indexation
		indexParallelRelations();
		// render curved relations (if necessary)
		adaptRelationsTypeAndCurvature();

		// this is currently the only way that re-renders sigma properly when
		// there is a layout or nodes/relations change (clearing/refreshing
		// /rendering sigma/sigma graph didn't work, not sure why)
		sigma.setCustomBBox(null);
		sigma.refresh({ skipIndexation: true });

		let needToSubscribeToAfterRender = true;

		if (algorithm === GRAPH_LAYOUT_FORCE_ATLAS_2) {
			assignForceAtlas2Layout();
		} else if (algorithm === GRAPH_LAYOUT_FORCE) {
			assignForceLayout();
		} else if (algorithm === GRAPH_LAYOUT_NOVERLAP) {
			assignNoverlapLayout();
		} else if (algorithm === GRAPH_LAYOUT_RANDOM) {
			assignRandomLayout();
		} else {
			needToSubscribeToAfterRender = false;
		}

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
			sigma.once('afterRender', showGraphContainer);
		} else {
			showGraphContainer();
		}
	};

	const labelColor = () => {
		if (theme === 'light') {
			return GRAPH_DEFAULT_LABEL_DARK_COLOR;
		}

		return GRAPH_DEFAULT_LABEL_LIGHT_COLOR;
	};

	return null;
};
