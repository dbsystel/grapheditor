import { backendApi } from 'src/utils/backend-api';

export const get = <T>(url: string) => {
	return backendApi.get<T>(url);
};
