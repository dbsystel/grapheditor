import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

type GetLoginResponse = {
	host: string;
	username: string;
};

export const getLogin = () => {
	return backendApi.get<GetLoginResponse>(endpoints.getLoginPath());
};
