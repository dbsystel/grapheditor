import './TableRow.scss';
import clsx from 'clsx';
import { TableRowProps } from './TableRow.interfaces';

/**
 * This component is we will use on various places to present data.
 * This was done without any design, so keep in mind the code here could be/is temporary
 * until a proper design for this component is done. Therefore, some elements/functions
 * are very similar and repeated.
 */
export const TableRow = ({ children, id, className, testId, ...rest }: TableRowProps) => {
	const rootElementClassName = clsx('table-row', className);

	return (
		<div id={id} className={rootElementClassName} data-testid={testId} role="row" {...rest}>
			{children}
		</div>
	);
};
