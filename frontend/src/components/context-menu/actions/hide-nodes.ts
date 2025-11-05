import { NodeId } from 'src/models/node';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useGraphStore } from 'src/stores/graph';

/**
 * Hide all graph nodes. Hiding graph nodes also hides their graph relations.
 */
export const hideNodesAction = (nodeIds: Array<NodeId>) => {
	nodeIds.forEach((nodeId) => {
		useGraphStore.getState().sigma.getGraph().setNodeAttribute(nodeId, 'hidden', true);
	});

	useContextMenuStore.getState().close();
};
