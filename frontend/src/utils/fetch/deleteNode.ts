import { AxiosResponse } from 'axios';
import { NodeId } from 'src/models/node';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type DeleteNodeParameters = { nodeId: NodeId };
export type DeleteNodeResponse = { num_deleted: number; message: string };

// use "deleteNodesAndUpdateApplication" instead
export const deleteNode = ({ nodeId }: DeleteNodeParameters) => {
	return backendApi.delete<DeleteNodeResponse, AxiosResponse<DeleteNodeResponse>>(
		endpoints.getNodePath({ nodeId: nodeId })
	);
};
