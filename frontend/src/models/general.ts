import { NodeId } from 'src/models/node';
import { SearchStoreType } from 'src/stores/search';

export type StyleProperties = Record<string, string>;

export type HomepageData = {
	title?: string;
	queriesTitle?: string;
	queriesList: Array<HomepageQuery>;
	graphTitle?: string;
	graphQuery: HomepageQuery;
};

export type HomepageQuery = {
	type: SearchStoreType;
	query?: string;
	queryParameters?: Record<string, string>;
	title: string;
	description: string;
	nodeId?: NodeId;
};

export type UUID = `${string}-${string}-${string}-${string}-${string}`;
