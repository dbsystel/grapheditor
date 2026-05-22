import { Database } from 'src/models/database';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type GetDatabasesResponse = {
	databases: Array<Database>;
};

export const getDatabases = () => {
	return backendApi.get<GetDatabasesResponse>(endpoints.getDatabasesPath());
};
