import { backendApi } from 'src/utils/backend-api';
import { endpoints } from 'src/utils/endpoints';

export type GetNodesPropertiesResponse = { properties: Array<string> };

export const getNodesProperties = () => {
	return backendApi.get<GetNodesPropertiesResponse>(endpoints.getNodesPropertiesPath());
};
