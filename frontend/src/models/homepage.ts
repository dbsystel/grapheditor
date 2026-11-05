import { NodeId } from 'src/models/node';
import { SearchStoreType } from 'src/stores/search';

export type HomepageData = {
	title?: string;
	queriesTitle?: string;
	queriesList: HomepageQueriesList;
	graphTitle?: string;
	graphQuery: HomepageQuery;
};

export type HomepageQueryGroup = {
	title: string;
	queries: HomepageQueriesList;
};

export type HomepageQueriesList = Array<HomepageQuery | HomepageQueryGroup>;

export type HomepageQuery = {
	type: SearchStoreType;
	query?: string;
	queryParameters?: Record<string, string>;
	title: string;
	description: string;
	nodeId?: NodeId;
};
