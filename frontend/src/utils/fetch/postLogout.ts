import { AxiosResponse } from 'axios';
import { backendApi } from 'src/utils/backend-api';
import { endpoints } from 'src/utils/endpoints';

export type PostLogoutParameters = {
	ssoLogout?: boolean;
};

export type PostLogoutResponse = string;

export const postLogout = (parameters: PostLogoutParameters) => {
	return backendApi.post<
		PostLogoutResponse,
		AxiosResponse<PostLogoutResponse>,
		PostLogoutParameters
	>(endpoints.getLogoutPath(), {
		ssoLogout: Boolean(parameters.ssoLogout)
	});
};
