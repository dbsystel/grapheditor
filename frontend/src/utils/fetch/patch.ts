import { AxiosResponse } from 'axios';
import { backendApi } from 'src/utils/backend-api';

export const patch = <T, D = unknown>(url: string, data: D) => {
	return backendApi.patch<T, AxiosResponse<T>, D>(url, data);
};
