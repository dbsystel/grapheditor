import { DatabaseInfo } from 'src/models/database';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type GetDatabasesResponse = {
	databases: Array<DatabaseInfo>;
};

export const getDatabases = () => {
	return backendApi.get<GetDatabasesResponse>(endpoints.getDatabasesPath());
};
