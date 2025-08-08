import './TableBody.scss';
import clsx from 'clsx';
import { TableBodyProps } from './TableBody.interfaces';

/**
 * This component is we will use on various places to present data.
 * This was done without any design, so keep in mind the code here could be/is temporary
 * until a proper design for this component is done. Therefore, some elements/functions
 * are very similar and repeated.
 */
export const TableBody = ({ children, id, className, testId }: TableBodyProps) => {
	const rootElementClassName = clsx('table-body', className);

	return (
		<div id={id} className={rootElementClassName} data-testid={testId} role="rowgroup">
			{children}
		</div>
	);
};
