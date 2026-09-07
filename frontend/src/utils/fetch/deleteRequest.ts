import { AxiosResponse } from 'axios';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type DeleteRequestParameters = { requestId: string };
export type DeleteRequestServerParameters = {
	terminated: number;
};
export type DeleteRequestResponse = {
	terminated: number;
};

export const deleteRequest = ({ requestId }: DeleteRequestParameters) => {
	return backendApi.delete<DeleteRequestResponse, AxiosResponse<DeleteRequestResponse>>(
		endpoints.getStopRequestPath({ requestId: requestId })
	);
};
