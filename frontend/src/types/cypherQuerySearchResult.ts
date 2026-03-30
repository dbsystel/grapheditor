import { ItemProperty, ItemPropertyDynamic } from 'src/models/item';
import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';

export type CypherQuerySearchResult = Array<Array<CypherQuerySearchResultItem>>;

export type CypherQuerySearchResultItem = [
	string,
	ItemProperty | ItemPropertyDynamic | Node | Relation
];
