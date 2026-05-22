import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type GetStyleResetResponse = string;

export const getStyleReset = () => {
	return backendApi.get<GetStyleResetResponse>(endpoints.getStylesResetPath());
};
