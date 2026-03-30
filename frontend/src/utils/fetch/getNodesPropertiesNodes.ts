import { AxiosResponse } from 'axios';
import { getNodesProperties } from 'src/utils/fetch/getNodesProperties';
import { postNodesBulkFetch, PostNodesBulkFetchResponse } from 'src/utils/fetch/postNodesBulkFetch';

export type GetNodesPropertiesNodesResponse = AxiosResponse<PostNodesBulkFetchResponse>;

export const getNodesPropertiesNodes = async () => {
	return getNodesProperties().then(async (response) => {
		return await postNodesBulkFetch({ nodeIds: response.data.properties });
	});
};
