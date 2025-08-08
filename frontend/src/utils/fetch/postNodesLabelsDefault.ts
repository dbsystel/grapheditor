import { AxiosResponse } from 'axios';
import { NodeLabelId } from 'src/models/node';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type PostNodesLabelsDefaultParameters = {
	labelIds: Array<NodeLabelId>;
};
type PostNodesLabelsDefaultServerParameters = {
	label_ids: PostNodesLabelsDefaultParameters['labelIds'];
};

export type PostNodesLabelsDefaultResponse = string;

export const postNodesLabelsDefault = ({ labelIds }: PostNodesLabelsDefaultParameters) => {
	return backendApi.post<
		PostNodesLabelsDefaultResponse,
		AxiosResponse<PostNodesLabelsDefaultResponse>,
		PostNodesLabelsDefaultServerParameters
	>(endpoints.getNodesLabelsDefaultPath(), {
		label_ids: labelIds
	});
};
