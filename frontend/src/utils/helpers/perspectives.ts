import {
	GraphEditorSigmaNodeAttributes,
	GraphEditorSigmaRelationAttributes
} from 'src/components/network-graph/NetworkGraph.interfaces';
import { NodePositions } from 'src/models/perspective';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';

export const preparePerspectiveDataAndRefreshNodesPosition = () => {
	const setNodePosition = useItemsStore.getState().setNodePosition;
	const graph = useGraphStore.getState().sigma.getGraph();
	const nodePositions: NodePositions = {};
	const visibleRelationIds: string[] = [];

	graph.forEachNode((nodeId: string, attributes: GraphEditorSigmaNodeAttributes) => {
		// hidden nodes are excluded from perspectives
		if (attributes.hidden) return;

		nodePositions[nodeId] = {
			x: attributes.x,
			y: attributes.y,
			z: 0
		};

		/* Update node data in memory, instead of reloading the graph from server.
		 * Important for layout change. Note: here we update node.style in the ItemsStore, not GraphStore
		 */
		setNodePosition(nodeId, { x: attributes.x, y: attributes.y, z: attributes.z }, true);
	});

	// hidden relations excluded from perspectives
	graph.forEachEdge((edgeId: string, attributes: GraphEditorSigmaRelationAttributes) => {
		if (attributes.hidden) return;

		visibleRelationIds.push(edgeId);
	});

	return {
		nodePositions: nodePositions,
		relationIds: visibleRelationIds
	};
};
