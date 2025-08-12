import { ReactNode } from 'react';
import { ItemInfo } from 'src/components/item-info/ItemInfo';
import { TableCell } from 'src/components/table-cell/TableCell';
import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { useItemsStore } from 'src/stores/items';
import { CypherQuerySearchResult } from 'src/types/cypherQuerySearchResult';
import { NOT_AVAILABLE_SIGN } from 'src/utils/constants';
import { isNode } from 'src/utils/helpers/nodes';
import { isRelation } from 'src/utils/helpers/relations';
import { RenderContent } from 'src/utils/helpers/search';

export const getSearchResultTableContent = (result: CypherQuerySearchResult) => {
	const keys: Array<Exclude<keyof Node, 'properties'> | Exclude<keyof Relation, 'properties'>> = [
		'title',
		'id',
		'_grapheditor_type',
		'description',
		'labels',
		'type',
		'target_id',
		'source_id'
	] as const;

	const keysToRender: Array<
		Array<Exclude<keyof Node, 'properties'> | Exclude<keyof Relation, 'properties'> | string>
	> = [];
	const propertyKeysToRender: Array<Array<string>> = [];
	const headCellsToRender: Array<ReactNode> = [];
	const bodyRowsToRender: Array<ReactNode> = [];
	const getStoreItem = useItemsStore.getState().getStoreItem;

	if (!result.length) {
		return {
			headCells: headCellsToRender,
			bodyRows: bodyRowsToRender
		};
	}

	result[0].forEach((result, index) => {
		const item = result[1];
		keysToRender[index] = [];

		if (isNode(item) || isRelation(item)) {
			// collect non-property keys to render for a column X
			keys.forEach((key) => {
				if (key in item) {
					keysToRender[index].push(key);
				}
			});
		}
		// check if node or relation is not missing
		else if (result[0] !== '') {
			// collect key from the user query for a column X
			keysToRender[index].push(result[0]);
		}

		// needed for later usage
		propertyKeysToRender[index] = [];
	});

	result.forEach((resultRow) => {
		resultRow.forEach(async (result, resultRowIndex) => {
			const item = result[1];

			if (isNode(item) || isRelation(item)) {
				const storeItem = getStoreItem(item.id);
				const x = storeItem || item;

				// collect property keys for a column X
				propertyKeysToRender[resultRowIndex]?.push(...Object.keys(x.properties));
			}
		});
	});

	// render all head cells (per column)
	keysToRender.forEach((keys, index) => {
		const headCellsContent: Array<ReactNode> = [];
		const classNamePropertyHeadings =
			index % 2 === 0
				? 'global-search-results-object-table__head-group-1 db-bg-color-basic-level-2'
				: 'global-search-results-object-table__head-group-2 db-bg-color-basic-level-2';

		// render regular keys
		keys.forEach((key, i) => {
			if (i === 0) {
				headCellsContent.push(
					<>
						<span className="global-search-results-object-table__first-level-head">
							{result[0][index][0]}
						</span>
						{key}
					</>
				);
			} else {
				headCellsContent.push(key);
			}
		});

		// create an array with unique values
		propertyKeysToRender[index] = Array.from(new Set(propertyKeysToRender[index]));

		// render property keys
		propertyKeysToRender[index].forEach((propertyKey) => {
			headCellsContent.push(<RenderContent content={propertyKey} />);
		});

		headCellsContent.forEach((headerCellContent, cellIndex) => {
			headCellsToRender.push(
				<TableCell
					key={'head-' + index + '' + cellIndex}
					asGridCell={true}
					className={classNamePropertyHeadings}
				>
					{headerCellContent}
				</TableCell>
			);
		});
	});

	result.forEach((resultRow, resultIndex) => {
		const content: Array<ReactNode> = [];
		resultRow.forEach(async (result, resultRowIndex) => {
			const item = result[1];

			if (isNode(item) || isRelation(item)) {
				const storeItem = getStoreItem(item.id);

				// first render regular keys content
				keysToRender[resultRowIndex].forEach((key) => {
					if (key in item) {
						if (key === 'title') {
							// if key is title, render value as ItemInfo component for better UX
							if (storeItem) {
								content.push(<ItemInfo item={storeItem} />);
							} else {
								content.push(NOT_AVAILABLE_SIGN);
							}
						} else {
							if (storeItem) {
								content.push(
									<RenderContent
										content={storeItem[key as keyof typeof storeItem]}
									/>
								);
							} else {
								content.push(NOT_AVAILABLE_SIGN);
							}
						}
					}
				});

				// then render property keys content
				propertyKeysToRender[resultRowIndex].forEach((propertyKey) => {
					if (storeItem && Object.hasOwn(storeItem.properties, propertyKey)) {
						content.push(JSON.stringify(storeItem.properties[propertyKey].value));
					} else {
						content.push(NOT_AVAILABLE_SIGN);
					}
				});
			}
			// node or relation missing
			else if (item === '' || item === null) {
				const cellContent = item === '' ? '""' : 'null';

				keysToRender[resultRowIndex].forEach(() => {
					content.push(cellContent);
				});
				propertyKeysToRender[resultRowIndex].forEach(() => {
					content.push(cellContent);
				});
			} else {
				content.push(<RenderContent content={item} />);
			}
		});

		const cells = content.map((cell, index) => {
			return (
				<TableCell
					key={resultIndex + '' + index}
					className="global-search-results-object-table__body-cell"
					asGridCell={true}
				>
					{cell}
				</TableCell>
			);
		});

		bodyRowsToRender.push(cells);
	});

	return {
		headCells: headCellsToRender,
		bodyRows: bodyRowsToRender
	};
};
