import { NodeId } from 'src/models/node';
import { useContextMenuStore } from 'src/stores/context-menu';
import { deleteNodesAndUpdateApplication } from 'src/utils/helpers/nodes';

export const deleteNodesAction = (nodeIds: Array<NodeId>) => {
	deleteNodesAndUpdateApplication(nodeIds, () => {
		useContextMenuStore.getState().close();
	});
};
