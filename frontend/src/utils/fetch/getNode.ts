import { Node, NodeId } from 'src/models/node';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type GetNodeParameters = { nodeId: NodeId };
export type GetNodeResponse = Node;

export const getNode = ({ nodeId }: GetNodeParameters) => {
	return backendApi.get<GetNodeResponse>(endpoints.getNodePath({ nodeId: nodeId }));
};
