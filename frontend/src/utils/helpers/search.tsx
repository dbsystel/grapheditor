import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';
import {
	AlgorithmType,
	algorithmTypes,
	SearchStoreSearchType,
	SearchStoreType
} from 'src/stores/search';
import { CypherQuerySearchResult } from 'src/types/cypherQuerySearchResult';
import {
	GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY,
	GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT,
	GLOBAL_SEARCH_TYPE_VALUE_PARA_QUERY,
	GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVE
} from 'src/utils/constants';

export const buildPerspectiveSearchResult = (
	nodes: Map<string, Node>,
	relations: Map<string, Relation>
) => {
	const result: CypherQuerySearchResult = [];
	const nodeIdsAlreadySeen = new Set<string>();

	relations.forEach((relation) => {
		const sourceId = relation.source_id;
		const targetId = relation.target_id;

		const sourceNode = nodes.get(sourceId);
		const targetNode = nodes.get(targetId);

		if (sourceNode && targetNode) {
			result.push([
				['Source', sourceNode],
				['Relation', relation],
				['Target', targetNode]
			]);
			nodeIdsAlreadySeen.add(sourceId);
			nodeIdsAlreadySeen.add(targetId);
		} else {
			console.warn('Perspective search result: the source and/or target nodes are missing.');
		}
	});

	nodes.forEach((node, nodeId) => {
		if (!nodeIdsAlreadySeen.has(nodeId)) {
			result.push([['Source', node]]);
		}
	});

	return result;
};

export const buildSimpleSearchResult = (nodes: Array<Node>, relations?: Array<Relation>) => {
	const length = Math.max(nodes.length, relations?.length || 0);
	const result: CypherQuerySearchResult = [];

	for (let i = 0, l = length; i < l; i++) {
		result[i] = [];

		const node = nodes.at(i);
		const relation = relations?.at(i);

		if (node) {
			result[i].push(['Node', node]);
		}
		if (relation) {
			result[i].push(['Relation', relation]);
		}
	}

	return result;
};

export const isValidSearchType = (value: unknown): value is SearchStoreType => {
	return (
		value === GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT ||
		value === GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY ||
		value === GLOBAL_SEARCH_TYPE_VALUE_PARA_QUERY ||
		value === GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVE
	);
};

export const isValidAlgorithmType = (value: unknown): value is AlgorithmType => {
	return algorithmTypes.some((type) => type === value);
};

export const isCypherQueryOrFullText = (value: unknown): value is SearchStoreSearchType => {
	return (
		value === GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY ||
		value === GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT
	);
};
