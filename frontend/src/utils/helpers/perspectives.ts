import { GraphEditorSigmaNodeAttributes } from 'src/components/network-graph/NetworkGraph.interfaces';
import { NodePositions } from 'src/models/perspective';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';

export const preparePerspectiveDataAndRefreshNodesPosition = () => {
	const setNodePosition = useItemsStore.getState().setNodePosition;
	const graph = useGraphStore.getState().sigma.getGraph();
	const nodePositions: NodePositions = {};

	graph.forEachNode((nodeId: string, attributes: GraphEditorSigmaNodeAttributes) => {
		// what about hidden nodes? Should they or should they not be added to the perspective?
		nodePositions[nodeId] = {
			x: attributes.x,
			y: attributes.y,
			z: 0
		};

		/* Update node data in memory, instead of reloading the graph from server.
		 * Important for layout change. Note: here we update node.style in the ItemsStore, not GraphStore
		 */
		setNodePosition({ id: nodeId, x: attributes.x, y: attributes.y, z: attributes.z }, true);
	});

	return {
		nodePositions: nodePositions,
		relationIds: graph.edges()
	};
};
