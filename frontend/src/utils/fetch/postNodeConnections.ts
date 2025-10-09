import { NodeConnections } from 'src/models/node';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type PostNodeConnectionsParameters = { nodeId: string };
export type PostNodeConnectionsResponse = NodeConnections;

export const postNodeConnections = ({ nodeId }: PostNodeConnectionsParameters) => {
	return backendApi.post<PostNodeConnectionsResponse>(
		endpoints.getNodeConnectionsPath({ nodeId: nodeId }),
		{
			direction: 'both', // incoming | outgoing | both
			// filter options
			relation_properties: {},
			neighbor_labels: [],
			neighbor_properties: {}
		}
	);
};
