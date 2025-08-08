import './GlobalSearchResultsTable.scss';
import clsx from 'clsx';
import { Table } from 'src/components/table/Table';
import { TableBody } from 'src/components/table-body/TableBody';
import { TableCell } from 'src/components/table-cell/TableCell';
import { TableHead } from 'src/components/table-head/TableHead';
import { TableRow } from 'src/components/table-row/TableRow';
import { useItemsStore } from 'src/stores/items';
import { useSearchStore } from 'src/stores/search';
import { GlobalSearchResultsTableProps } from './GlobalSearchResultsTable.interfaces';
import { RenderSearchResultCellElement } from './helpers';

/**
 * Presentational component responsible for rendering a tabular list of global
 * search results. The heading cells are sticky. Each cell content (string) can
 * be copied to clipboard.
 *
 * This component is using a mixture of "result" prop nodes and relations and
 * the ones stored in the items store. It is done like this in order to keep
 * the table structure intact in case we remove a node or relation from the
 * items store. If a node or relation is missing in the items store, a placeholder
 * will be rendered (NOT_AVAILABLE_SIGN at the moment).
 *
 * NOTE: at the moment this component is NOT fetching node values, but instead
 * is using the search data as-is.
 */
export const GlobalSearchResultsTable = ({
	id,
	className,
	testId
}: GlobalSearchResultsTableProps) => {
	const result = useSearchStore((store) => store.result);
	useItemsStore((store) => store.nodes);
	useItemsStore((store) => store.relations);
	const rootElementClassName = clsx('global-search-results-table', className);

	if (!result) {
		return null;
	}

	const tableHeadCells = result[0].map((item) => {
		return item[0];
	});

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<Table>
				<TableHead className="db-bg-color-basic-level-2">
					<TableRow>
						{tableHeadCells.map((tableHeadCell, index) => {
							return <TableCell key={index}>{tableHeadCell}</TableCell>;
						})}
					</TableRow>
				</TableHead>
				<TableBody>
					{result.map((searchResult, index) => {
						return (
							<TableRow key={index}>
								<RenderSearchResultCellElement result={searchResult} />
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
};
