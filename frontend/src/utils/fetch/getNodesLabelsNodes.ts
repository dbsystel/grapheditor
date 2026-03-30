import { AxiosResponse } from 'axios';
import { getNodesLabels } from 'src/utils/fetch/getNodesLabels';
import { postNodesBulkFetch, PostNodesBulkFetchResponse } from 'src/utils/fetch/postNodesBulkFetch';

export type GetNodesLabelsNodesResponse = AxiosResponse<PostNodesBulkFetchResponse>;

export const getNodesLabelsNodes = async () => {
	return getNodesLabels().then(async (response) => {
		return await postNodesBulkFetch({ nodeIds: response.data.labels });
	});
};
