import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type GetStylesResponse = {
	filenames: Array<string>;
};

export const getStyles = () => {
	return backendApi.get<GetStylesResponse>(endpoints.getStylesPath());
};
