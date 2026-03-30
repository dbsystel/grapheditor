import { AxiosResponse } from 'axios';
import { backendApi } from 'src/utils/backend-api';
import { endpoints } from 'src/utils/endpoints';

export type PostLoginParameters = {
	host: string;
	username: string;
	password: string;
};

export type PostLoginResponse = {
	host: string;
	username: string;
};

export const postLogin = ({ host, username, password }: PostLoginParameters) => {
	return backendApi.post<
		PostLoginResponse,
		AxiosResponse<PostLoginResponse>,
		PostLoginParameters
	>(endpoints.getLoginPath(), {
		host: host,
		username: username,
		password: password
	});
};
