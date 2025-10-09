import { Node, NodeId } from 'src/models/node';
import { Relation, RelationId } from 'src/models/relation';
import { CypherQuerySearchResult } from 'src/types/cypherQuerySearchResult';
import { isObject } from 'src/utils/helpers/general';
import { isNode } from 'src/utils/helpers/nodes';
import { isRelation } from 'src/utils/helpers/relations';

export const processResult = (result: CypherQuerySearchResult) => {
	const nodesMap: Map<NodeId, Node> = new Map();
	const relationsMap: Map<RelationId, Relation> = new Map();
	const processResultCell = (content: unknown) => {
		// if content type is object
		if (isObject(content)) {
			if (isNode(content)) {
				nodesMap.set(content.id, content);
			} else if (isRelation(content)) {
				relationsMap.set(content.id, content);
			} else {
				for (const [, value] of Object.entries(content)) {
					processResultCell(value);
				}
			}
		}
		// array, loop through it
		else if (Array.isArray(content)) {
			content.forEach((contentItem) => {
				processResultCell(contentItem);
			});
		}
	};
	result.forEach((searchResult) => {
		Object.values(searchResult).map((rowValue) => {
			processResultCell(rowValue[1]);
		});
	});
	return {
		nodesMap: nodesMap,
		relationsMap: relationsMap
	};
};
