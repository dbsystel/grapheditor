import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type GetNodesPropertiesResponse = { properties: Array<string> };

export const getNodesProperties = () => {
	return backendApi.get<GetNodesPropertiesResponse>(endpoints.getNodesPropertiesPath());
};
