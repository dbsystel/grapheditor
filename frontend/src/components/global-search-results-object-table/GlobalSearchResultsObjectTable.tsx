import './GlobalSearchResultsObjectTable.scss';
import clsx from 'clsx';
import { Table } from 'src/components/table/Table';
import { useItemsStore } from 'src/stores/items';
import { useSearchStore } from 'src/stores/search';
import { GlobalSearchResultsObjectTableProps } from './GlobalSearchResultsObjectTable.interfaces';
import { getSearchResultTableContent } from './helpers';

/**
 * This component is using a mixture of "result" prop nodes and relations and
 * the ones stored in the items store. It is done like this in order to keep
 * the table structure intact in case we remove a node or relation from the
 * items store. If a node or relation is missing in the items store, a placeholder
 * will be rendered (NOT_AVAILABLE_SIGN at the moment).
 */

export const GlobalSearchResultsObjectTable = ({
	id,
	className,
	testId
}: GlobalSearchResultsObjectTableProps) => {
	const result = useSearchStore((store) => store.result);
	// observe node and relations store changes
	useItemsStore((store) => store.nodes);
	useItemsStore((store) => store.relations);
	const rootElementClassName = clsx('global-search-results-object-table', className);

	if (!result.data) {
		return;
	}

	const tableContent = getSearchResultTableContent(result.data);

	const style = {
		gridTemplateColumns: `repeat(${tableContent.headCells.length},  minmax(min-content, 300px))`
	};

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<div className="global-search-results-object-table__content">
				<Table key={1} asGrid={true} style={style}>
					{tableContent.headCells}
					{tableContent.bodyRows}
				</Table>
			</div>
		</div>
	);
};
