import { AxiosResponse } from 'axios';
import { Node, NodeId } from 'src/models/node';
import { backendApi } from 'src/utils/backend-api';
import { endpoints } from 'src/utils/endpoints';

export type PostNodesBulkFetchParameters = {
	nodeIds: Array<NodeId>;
};

export type PostNodesBulkFetchResponse = {
	nodes: Record<NodeId, Node>;
};

type PostNodesBulkFetchAxiosParameters = {
	ids: Array<NodeId>;
};

export const postNodesBulkFetch = ({ nodeIds }: PostNodesBulkFetchParameters) => {
	return backendApi.post<
		PostNodesBulkFetchResponse,
		AxiosResponse<PostNodesBulkFetchResponse>,
		PostNodesBulkFetchAxiosParameters
	>(endpoints.getNodesBulkFetchPath(), { ids: nodeIds });
};
