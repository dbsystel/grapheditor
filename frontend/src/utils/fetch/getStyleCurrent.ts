import { backendApi } from 'src/utils/backend-api';
import { endpoints } from 'src/utils/endpoints';

export type GetStyleCurrentResponse = { filename: string };

export const getStyleCurrent = () => {
	return backendApi.get<GetStyleCurrentResponse>(endpoints.getStylesCurrentPath());
};
