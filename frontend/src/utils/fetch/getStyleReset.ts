import { backendApi } from 'src/utils/backend-api';
import { endpoints } from 'src/utils/endpoints';

export type GetStyleResetResponse = string;

export const getStyleReset = () => {
	return backendApi.get<GetStyleResetResponse>(endpoints.getStylesResetPath());
};
