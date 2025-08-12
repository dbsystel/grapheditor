import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';

export type CypherQuerySearchResult = Array<Array<CypherQuerySearchResultItem>>;

export type CypherQuerySearchResultItem = [
	string,
	number | string | null | Node | Relation | Array<Node | Relation>
];
