import { Database } from 'src/models/database';
import { backendApi } from 'src/utils/backend-api';
import { endpoints } from 'src/utils/endpoints';

export type GetDatabasesCurrentResponse = Database;

export const getDatabaseCurrent = () => {
	return backendApi.get<GetDatabasesCurrentResponse>(endpoints.getDatabasesCurrentPath());
};
