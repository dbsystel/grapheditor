import { NodeId } from 'src/models/node';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useGraphStore } from 'src/stores/graph';

export const hideNodesAction = (nodeIds: Array<NodeId>) => {
	nodeIds.forEach((nodeId) => {
		// note: hiding a node will hide its relations
		useGraphStore.getState().sigma.getGraph().setNodeAttribute(nodeId, 'hidden', true);
	});

	useContextMenuStore.getState().close();
};
