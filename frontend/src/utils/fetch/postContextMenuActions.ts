import { AxiosResponse } from 'axios';
import { ContextMenuAction } from 'src/components/context-menu/ContextMenu.interfaces';
import { NodeId } from 'src/models/node';
import { RelationId } from 'src/models/relation';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type PostContextMenuActionsParameters = {
	nodeIds: Array<NodeId>;
	relationIds: Array<RelationId>;
};

type PostContextMenuActionsServerParameters = {
	node_ids: PostContextMenuActionsParameters['nodeIds'];
	relation_ids: PostContextMenuActionsParameters['relationIds'];
};

export type PostContextMenuActionsRequestResponse = {
	actions: Array<ContextMenuActionType>;
};

export type ContextMenuActionType = {
	action: ContextMenuAction;
	enabled: boolean;
};

export const postContextMenuActions = ({
	nodeIds,
	relationIds
}: PostContextMenuActionsParameters) => {
	return backendApi.post<
		PostContextMenuActionsRequestResponse,
		AxiosResponse<PostContextMenuActionsRequestResponse>,
		PostContextMenuActionsServerParameters
	>(endpoints.getContextMenuActionsPath(), {
		node_ids: nodeIds,
		relation_ids: relationIds
	});
};
