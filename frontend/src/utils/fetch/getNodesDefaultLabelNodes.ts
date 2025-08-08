import { Node } from 'src/models/node';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type GetNodesDefaultLabelNodesResponse = { nodes: Array<Node> };

export const getNodesDefaultLabelNodes = () => {
	return backendApi.get<GetNodesDefaultLabelNodesResponse>(endpoints.getNodesLabelsDefaultPath());
};
