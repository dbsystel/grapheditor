import { ReactNode } from 'react';
import { ItemInfo } from 'src/components/item-info/ItemInfo';
import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { useItemsStore } from 'src/stores/items';
import { CypherQuerySearchResult } from 'src/types/cypherQuerySearchResult';
import { NOT_AVAILABLE_SIGN } from 'src/utils/constants';
import { isObject, isPrimitive } from 'src/utils/helpers/general';
import { isNode } from 'src/utils/helpers/nodes';
import { isRelation } from 'src/utils/helpers/relations';
import { idFormatter } from 'src/utils/idFormatter';

export const RenderContent = ({ content }: { content: unknown }): ReactNode => {
	const getItem = useItemsStore((store) => store.getItem);
	let contentToRender: ReactNode = null;

	// if content type is primitive
	if (isPrimitive(content)) {
		if (typeof content === 'string') {
			contentToRender = idFormatter.parseIdToName(content);
		} else {
			contentToRender = content;
		}
	}
	// if content type is object
	else if (isObject(content)) {
		// if relation or node
		if (isRelation(content) || isNode(content)) {
			const item = getItem(content);

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
						{key}:<RenderContent key={key} content={value} />
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

	return contentToRender;
};

export const buildSearchResult = (nodes: Map<string, Node>, relations: Map<string, Relation>) => {
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
