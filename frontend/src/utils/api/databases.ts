import { getDatabaseCurrent } from 'src/utils/fetch/getDatabaseCurrent';
import { getDatabases } from 'src/utils/fetch/getDatabases';
import { postDatabaseCurrent } from 'src/utils/fetch/postDatabaseCurrent';

// TODO use this api object throughout the application (this is valid for all api objects)
export const databasesApi = {
	getDatabases: getDatabases,
	getDatabaseCurrent: getDatabaseCurrent,
	postDatabaseCurrent: postDatabaseCurrent
};
