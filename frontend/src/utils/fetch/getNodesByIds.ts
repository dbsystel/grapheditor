import { NodeId } from 'src/models/node';
import { getNode } from 'src/utils/fetch/getNode';

export type GetNodesByIdsParameters = {
	nodeIds: Array<NodeId>;
};

export const getNodesByIds = async ({ nodeIds }: GetNodesByIdsParameters) => {
	const results = await Promise.all(
		nodeIds.map((nodeId) => {
			return getNode({ nodeId: nodeId });
		})
	);

	return results.map((result) => result.data);
};
