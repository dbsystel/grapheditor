import { AxiosResponse } from 'axios';
import { getRelationsTypes } from 'src/utils/fetch/getRelationsTypes';
import { postNodesBulkFetch, PostNodesBulkFetchResponse } from 'src/utils/fetch/postNodesBulkFetch';

export type GetRelationsTypesNodesResponse = AxiosResponse<PostNodesBulkFetchResponse>;

export const getRelationsTypesNodes = async () => {
	return getRelationsTypes().then(async (response) => {
		return await postNodesBulkFetch({ nodeIds: response.data.types });
	});
};
