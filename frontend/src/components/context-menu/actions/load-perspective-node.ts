import { NodeId } from 'src/models/node';
import { useContextMenuStore } from 'src/stores/context-menu';
import { getPerspective } from 'src/utils/fetch/getPerspective';
import { processPerspective } from 'src/utils/helpers/nodes';

export const loadPerspectiveNodeAction = (nodeId: NodeId) => {
	getPerspective({ perspectiveId: nodeId }).then((response) => {
		processPerspective(response.data);

		useContextMenuStore.getState().close();
	});
};
