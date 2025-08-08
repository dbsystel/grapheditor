export type DatabaseStatus = 'online' | 'offline';

export type DatabaseInfo = {
	name: string;
	status: DatabaseStatus;
};
