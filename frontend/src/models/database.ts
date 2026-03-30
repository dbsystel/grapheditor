export type DatabaseStatus = 'online' | 'offline';
export type DatabaseType = 'system' | 'standard' | 'composite';

export type Database = {
	name: string;
	status: DatabaseStatus;
	type: DatabaseType;
};
