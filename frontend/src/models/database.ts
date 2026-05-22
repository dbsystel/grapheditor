export type DatabaseStatus = 'online' | 'offline';
export type DatabaseType = 'system' | 'standard' | 'composite';
export type DatabaseFeatures = 'Perspectives';

export type Database = {
	name: string;
	status: DatabaseStatus;
	type: DatabaseType;
	// available only when working with a single database (get/post current database) due to performance reasons
	features?: Array<DatabaseFeatures>;
};
