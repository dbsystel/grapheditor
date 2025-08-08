import { DatabaseInfo } from 'src/models/database';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type GetDatabasesCurrentResponse = DatabaseInfo;

export const getDatabaseCurrent = () => {
	return backendApi.get<GetDatabasesCurrentResponse>(endpoints.getDatabasesCurrentPath());
};
