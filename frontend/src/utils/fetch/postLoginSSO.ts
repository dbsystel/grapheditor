import { AxiosResponse } from 'axios';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';
import { PostLoginResponse } from 'src/utils/fetch/postLogin';

export type PostLoginSSOParameters = {
	host: string;
	useToken: boolean;
};
export type PostLoginSSOResponse =
	| {
			authorizationUrl: string;
	  }
	| PostLoginResponse;

export const postLoginSSO = ({ host, useToken }: PostLoginSSOParameters) => {
	return backendApi.post<
		PostLoginSSOResponse,
		AxiosResponse<PostLoginSSOResponse>,
		PostLoginSSOParameters
	>(endpoints.getLoginPath(), {
		host: host,
		useToken: useToken
	});
};
