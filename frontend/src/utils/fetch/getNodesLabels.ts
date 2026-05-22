import { NodeLabel } from 'src/models/node';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type GetNodesLabelsResponse = { labels: Array<NodeLabel> };

export const getNodesLabels = () => {
	return backendApi.get<GetNodesLabelsResponse>(endpoints.getNodesLabelsPath());
};
