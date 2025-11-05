import { AxiosResponse } from 'axios';
import { Node, NodeId } from 'src/models/node';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type PostNodesBulkFetchParameters = {
	nodeIds: Array<NodeId>;
};

type PostNodesBulkFetchResponse = {
	nodes: Record<NodeId, Node>;
};

type PostNodesBulkFetchAxiosParameters = {
	ids: Array<NodeId>;
};

export const postNodesBulkFetch = async ({ nodeIds }: PostNodesBulkFetchParameters) => {
	const response = await backendApi.post<
		PostNodesBulkFetchResponse,
		AxiosResponse<PostNodesBulkFetchResponse>,
		PostNodesBulkFetchAxiosParameters
	>(endpoints.getNodesBulkFetchPath(), { ids: nodeIds });

	// TODO return fetch, don't adapt data format
	return Object.values(response.data.nodes);
};
