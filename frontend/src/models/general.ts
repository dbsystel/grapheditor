import { ItemPropertyKey, ItemPropertyType } from 'src/models/item';
import { NodeId } from 'src/models/node';
import { SearchStoreType } from 'src/stores/search';

export type FormItemProperty = {
	key: ItemPropertyKey;
	value: string;
	type: ItemPropertyType;
};

export type FormItemPostProperty = {
	value: string;
	type: ItemPropertyType;
};

export type FormItemPostProperties = Record<string, FormItemPostProperty>;

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
