import { ReactNode } from 'react';
import { ItemInfo } from 'src/components/item-info/ItemInfo';
import { MarkdownWrapper } from 'src/components/markdown-wrapper/Markdown-Wrapper';
import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { useItemsStore } from 'src/stores/items';
import { SearchStoreType } from 'src/stores/search';
import { CypherQuerySearchResult } from 'src/types/cypherQuerySearchResult';
import {
	GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY,
	GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT,
	GLOBAL_SEARCH_TYPE_VALUE_PARA_QUERY,
	GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVE,
	NOT_AVAILABLE_SIGN
} from 'src/utils/constants';
import { isObject, isPrimitive, isString } from 'src/utils/helpers/general';
import { isNode } from 'src/utils/helpers/nodes';
import { isRelation } from 'src/utils/helpers/relations';
import { idFormatter } from 'src/utils/idFormatter';

type RenderContentProps = {
	content: unknown;
	applyMarkdown?: boolean;
};

/**
 * This component should render output as markdown only if the initial input (the "content" prop) is
 * of type "string". By the "initial input" we mean the input originally given to the component, before
 * recursive calls.
 */
export const RenderContent = ({ content, applyMarkdown }: RenderContentProps): ReactNode => {
	const getStoreItem = useItemsStore((store) => store.getStoreItem);
	let contentToRender: ReactNode = null;

	// if content type is primitive
	if (isPrimitive(content)) {
		if (content === '' || content === null) {
			const cellContent = content === '' ? '""' : 'null';

			contentToRender = cellContent;
		} else if (typeof content === 'string') {
			contentToRender = idFormatter.parseIdToName(content);
		} else {
			contentToRender = content;
		}
	}
	// if content type is object
	else if (isObject(content)) {
		// if relation or node
		if (isRelation(content) || isNode(content)) {
			const item = getStoreItem(content.id);

			if (item) {
				contentToRender = <ItemInfo item={item} />;
			} else {
				contentToRender = NOT_AVAILABLE_SIGN;
			}
		}
		// some other object (record), loop through entries
		else {
			const objectContent: Array<ReactNode> = ['{'];
			for (const [key, value] of Object.entries(content)) {
				objectContent.push(
					<span key={key}>
						{key}:
						<RenderContent key={key} content={value} />
					</span>
				);
			}
			objectContent.push('}');

			return objectContent;
		}
	}
	// array, loop through it
	else if (Array.isArray(content)) {
		const finalContent: Array<ReactNode> = ['['];

		content.forEach((contentItem, index) => {
			finalContent.push(<RenderContent key={index} content={contentItem} />);

			if (index < content.length - 1) {
				finalContent.push(', ');
			}
		});

		finalContent.push(']');

		return finalContent;
	}
	// not sure what it is, just render a formatted JSON string
	else {
		contentToRender = (
			<pre className="global-search-results-table__pre">
				{JSON.stringify(content, null, 2)}
			</pre>
		);
	}

	if (applyMarkdown && isString(contentToRender)) {
		return <MarkdownWrapper>{contentToRender}</MarkdownWrapper>;
	}

	return contentToRender;
};

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
		result[i] = [
			['', ''],
			['', '']
		];

		const node = nodes.at(i);
		const relation = relations?.at(i);

		if (node) {
			result[i][0] = ['Node', node];
		}
		if (relation) {
			result[i][1] = ['Relation', relation];
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
