import { AxiosResponse } from 'axios';
import { Node, NodeId } from 'src/models/node';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';
import { PostNodeParameters } from 'src/utils/fetch/postNode';

export type PostNodesParameters = Array<PostNodeParameters>;
export type PostNodesServerParameters = {
	nodes: Array<PostNodeParameters>;
};
export type PostNodesResponse = {
	nodes: Record<NodeId, Node>;
};

export const postNodes = (nodes: PostNodesParameters) => {
	return backendApi.post<
		PostNodesResponse,
		AxiosResponse<PostNodesResponse>,
		PostNodesServerParameters
	>(endpoints.getNodesBulkPostPath(), {
		nodes: nodes
	});
};
