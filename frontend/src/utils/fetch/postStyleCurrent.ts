import { AxiosResponse } from 'axios';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type PostStyleCurrentParameters = {
	filename: string;
};

export type PostStyleCurrentResponse = string;

export const postStyleCurrent = (parameters: PostStyleCurrentParameters) => {
	return backendApi.post<
		PostStyleCurrentResponse,
		AxiosResponse<PostStyleCurrentResponse>,
		PostStyleCurrentParameters
	>(endpoints.getStylesCurrentPath(), parameters);
};
