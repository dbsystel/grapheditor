import { backendApi } from 'src/utils/api';

export const get = <T>(url: string) => {
	return backendApi.get<T>(url);
};
