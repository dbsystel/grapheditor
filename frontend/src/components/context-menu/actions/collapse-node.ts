import { NodeId } from 'src/models/node';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';

export const collapseNodeAction = (nodeId: NodeId) => {
	const expandedNodeNodeAndRelationIds = useContextMenuStore
		.getState()
		.getExpandedNodeNodeAndRelationIds(nodeId);

	expandedNodeNodeAndRelationIds.nodeIds.forEach((nodeId) => {
		useGraphStore.getState().removeNode(nodeId);
		useItemsStore.getState().removeNode(nodeId, true);
	});

	useItemsStore.getState().refreshNodesAndRelations();

	useContextMenuStore.getState().removeExpandedNode(nodeId);
	useContextMenuStore.getState().close();
};
