import { NodeId } from 'src/models/node';
import { useContextMenuStore } from 'src/stores/context-menu';
import { api } from 'src/utils/api/api';

export const deleteNodesAction = (nodeIds: Array<NodeId>) => {
	api.nodes.actions.deleteNodesAndUpdateApplication(nodeIds).then(() => {
		useContextMenuStore.getState().close();
	});
};
