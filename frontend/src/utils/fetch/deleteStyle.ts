import { AxiosResponse } from 'axios';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type DeleteStyleParameters = { grassFileName: string };
export type DeleteStyleResponse = string;

export const deleteStyle = ({ grassFileName }: DeleteStyleParameters) => {
	return backendApi.delete<DeleteStyleResponse, AxiosResponse<DeleteStyleResponse>>(
		endpoints.getStylePath({ grassFileName: grassFileName })
	);
};
