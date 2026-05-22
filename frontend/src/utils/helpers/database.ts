import { Database } from 'src/models/database';

export const databaseSupportsPerspectives = (database: Database) => {
	return !!database.features?.includes('Perspectives');
};
