import { CopyToClipboard } from 'src/components/copy-to-clipboard/CopyToClipboard';
import { TableCell } from 'src/components/table-cell/TableCell';
import { useItemsStore } from 'src/stores/items';
import { CypherQuerySearchResultItem } from 'src/types/cypherQuerySearchResult';
import { isNode } from 'src/utils/helpers/nodes';
import { isRelation } from 'src/utils/helpers/relations';
import { RenderContent } from 'src/utils/helpers/search';
import { isString } from 'src/utils/helpers/general';

export const RenderSearchResultCellElement = ({
	result
}: {
	result: Array<CypherQuerySearchResultItem>;
}) => {
	const getStoreItem = useItemsStore.getState().getStoreItem;

	return Object.values(result).map((rowValue, index) => {
		const resultValue = rowValue[1];
		const isResultValueString = isString(resultValue);
		const storeItem =
			isNode(resultValue) || isRelation(resultValue) ? getStoreItem(resultValue.id) : null;
		const isResultNode = isNode(storeItem);
		const isResultRelation = isRelation(storeItem);

		return (
			<TableCell key={index}>
				<RenderContent
					content={resultValue}
					applyMarkdown={isResultValueString}
					key={index}
				/>
				{storeItem && (
					<CopyToClipboard
						nodes={isResultNode ? [storeItem] : []}
						relations={isResultRelation ? [storeItem] : []}
					/>
				)}
			</TableCell>
		);
	});
};
