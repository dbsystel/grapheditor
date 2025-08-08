import { AxiosResponse } from 'axios';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type PostDatabaseCurrentParameters = {
	name: string;
};

export type PostDatabaseCurrentResponse = string;

export const postDatabaseCurrent = ({ name }: PostDatabaseCurrentParameters) => {
	return backendApi.post<
		PostDatabaseCurrentResponse,
		AxiosResponse<PostDatabaseCurrentResponse>,
		PostDatabaseCurrentParameters
	>(endpoints.getDatabasesCurrentPath(), { name: name });
};
