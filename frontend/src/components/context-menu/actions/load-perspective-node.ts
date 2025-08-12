import { NodeId } from 'src/models/node';
import { useContextMenuStore } from 'src/stores/context-menu';
import { nodesApi } from 'src/utils/api/nodes';
import { processPerspective } from 'src/utils/helpers/nodes';

export const loadPerspectiveNodeAction = (nodeId: NodeId) => {
	nodesApi.getPerspective({ perspectiveId: nodeId }).then((response) => {
		processPerspective(response.data);

		useContextMenuStore.getState().close();
	});
};
