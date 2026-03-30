import { NodeId } from 'src/models/node';
import { useContextMenuStore } from 'src/stores/context-menu';
import { api } from 'src/utils/api/api';
import { processPerspective } from 'src/utils/helpers/nodes';

export const loadPerspectiveNodeAction = (nodeId: NodeId) => {
	api.perspectives.fetch.getPerspective({ perspectiveId: nodeId }).then((response) => {
		processPerspective(response.data);

		useContextMenuStore.getState().close();
	});
};
