import './TableCell.scss';
import clsx from 'clsx';
import { TableCellProps } from './TableCell.interfaces';

/**
 * This component is we will use on various places to present data.
 * This was done without any design, so keep in mind the code here could be/is temporary
 * until a proper design for this component is done. Therefore, some elements/functions
 * are very similar and repeated.
 *
 * TODO check if the component is inside the TableHead component and set the
 * "role" attribute to "columnheader".
 */
export const TableCell = ({
	children,
	width = 'auto',
	id,
	className,
	testId,
	asGridCell
}: TableCellProps) => {
	const rootElementClassName = clsx('table-cell', className, {
		'table-cell__auto': !asGridCell && width === 'auto',
		'table-cell__full': !asGridCell && width === 'full',
		'table-cell__minimal': !asGridCell && width === 'minimal',
		'table-cell__grid-cell': asGridCell
	});
	return (
		<div id={id} className={rootElementClassName} data-testid={testId} role="cell">
			{children}
		</div>
	);
};
