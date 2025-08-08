import { Node } from 'src/models/node';
import { getNodesLabels } from 'src/utils/fetch/getNodesLabels';
import { postNodesBulkFetch } from 'src/utils/fetch/postNodesBulkFetch';

export type GetNodesLabelsNodesResponse = Array<Node>;

export const getNodesLabelsNodes = async () => {
	return getNodesLabels().then(async (response) => {
		return await postNodesBulkFetch({ nodeIds: response.data.labels });
	});
};
