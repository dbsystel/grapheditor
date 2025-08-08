import { Node } from 'src/models/node';
import { getNodesProperties } from 'src/utils/fetch/getNodesProperties';
import { postNodesBulkFetch } from 'src/utils/fetch/postNodesBulkFetch';

export type GetNodesPropertiesNodesResponse = Array<Node>;

export const getNodesPropertiesNodes = async () => {
	return getNodesProperties().then(async (response) => {
		return await postNodesBulkFetch({ nodeIds: response.data.properties });
	});
};
