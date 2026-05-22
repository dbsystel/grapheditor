import { AxiosResponse } from 'axios';
import { NodeId } from 'src/models/node';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type DeleteNodesParameters = { nodeIds: Array<NodeId> };
export type DeleteNodesServerParameters = { ids: Array<NodeId> };
export type DeleteNodesResponse = { num_deleted: number; message: string };

export const deleteNodes = ({ nodeIds }: DeleteNodesParameters) => {
	return backendApi.delete<
		DeleteNodesResponse,
		AxiosResponse<DeleteNodesResponse>,
		DeleteNodesServerParameters
	>(endpoints.getNodesBulkDeletePath(), {
		data: {
			ids: nodeIds
		}
	});
};
