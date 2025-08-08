import { AxiosResponse } from 'axios';
import { backendApi } from '../api';
import { endpoints } from '../endpoints';

export type PostLogoutResponse = string;

export const postLogout = () => {
	return backendApi.post<PostLogoutResponse, AxiosResponse<PostLogoutResponse>, never>(
		endpoints.getLogoutPath()
	);
};
