import { getDatabaseCurrent } from 'src/utils/fetch/getDatabaseCurrent';
import { getDatabases } from 'src/utils/fetch/getDatabases';
import { postDatabaseCurrent } from 'src/utils/fetch/postDatabaseCurrent';

export const databasesApi = {
	getDatabases: getDatabases,
	getDatabaseCurrent: getDatabaseCurrent,
	postDatabaseCurrent: postDatabaseCurrent
};
