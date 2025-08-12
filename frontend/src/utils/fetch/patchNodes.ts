import { AxiosResponse } from 'axios';
import { Node, NodeId, PatchNode } from 'src/models/node';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type PatchNodesParameters = Array<PatchNode>;
export type PatchNodesServerParameters = {
	patches: Array<PatchNode>;
};
export type PatchNodesResponse = {
	nodes: Record<NodeId, Node>;
};

export const patchNodes = (nodes: PatchNodesParameters) => {
	return backendApi.patch<
		PatchNodesResponse,
		AxiosResponse<PatchNodesResponse>,
		PatchNodesServerParameters
	>(endpoints.getNodesBulkPatchPath(), {
		patches: nodes
	});
};
