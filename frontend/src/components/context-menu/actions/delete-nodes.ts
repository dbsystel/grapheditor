import { NodeId } from 'src/models/node';
import { useContextMenuStore } from 'src/stores/context-menu';
import { nodesApi } from 'src/utils/api/nodes';

export const deleteNodesAction = (nodeIds: Array<NodeId>) => {
	nodesApi.deleteNodesAndUpdateApplication(nodeIds, {
		onSuccess: () => {
			useContextMenuStore.getState().close();
		}
	});
};
