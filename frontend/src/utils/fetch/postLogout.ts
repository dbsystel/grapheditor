import { AxiosResponse } from 'axios';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type PostLogoutResponse = string;

export const postLogout = () => {
	return backendApi.post<PostLogoutResponse, AxiosResponse<PostLogoutResponse>, never>(
		endpoints.getLogoutPath()
	);
};
