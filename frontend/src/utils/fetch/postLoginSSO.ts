import { AxiosResponse } from 'axios';
import { backendApi } from 'src/utils/backend-api';
import { endpoints } from 'src/utils/endpoints';

export type PostLoginSSOParameters = {
	host: string;
	useToken: boolean;
};
export type PostLoginSSOResponse =
	| {
			authorizationUrl: string;
	  }
	| {
			host: string;
			username: string;
	  };

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
