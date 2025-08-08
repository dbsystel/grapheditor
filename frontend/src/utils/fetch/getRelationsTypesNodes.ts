import { Node } from 'src/models/node';
import { getRelationsTypes } from 'src/utils/fetch/getRelationsTypes';
import { postNodesBulkFetch } from 'src/utils/fetch/postNodesBulkFetch';

export type GetRelationsTypesNodesResponse = Array<Node>;

export const getRelationsTypesNodes = async () => {
	return getRelationsTypes().then(async (response) => {
		return await postNodesBulkFetch({ nodeIds: response.data.types });
	});
};
