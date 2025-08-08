import './TableHead.scss';
import clsx from 'clsx';
import { TableHeadProps } from './TableHead.interfaces';

/**
 * This component is we will use on various places to present data.
 * This was done without any design, so keep in mind the code here could be/is temporary
 * until a proper design for this component is done. Therefore, some elements/functions
 * are very similar and repeated.
 */
export const TableHead = ({ children, className, id, testId }: TableHeadProps) => {
	const rootElementClassName = clsx('table-head', className);

	return (
		<div id={id} className={rootElementClassName} data-testid={testId} role="rowgroup">
			{children}
		</div>
	);
};
