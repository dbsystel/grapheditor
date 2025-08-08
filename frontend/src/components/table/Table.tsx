import './Table.scss';
import clsx from 'clsx';
import { TableProps } from './Table.interfaces';

/**
 * This component is we will use on various places to present data.
 * This was done without any design, so keep in mind the code here could be/is temporary
 * until a proper design for this component is done. Therefore, some elements/functions
 * are very similar and repeated.
 *
 * 	// TODO use context to signal children we are rendering as grid
 */

export const Table = ({ children, className, id, testId, width, asGrid, style }: TableProps) => {
	const rootElementClassName = clsx('table', className, {
		table__auto: !asGrid && width === 'auto',
		table__full: !asGrid && width === 'full',
		table__grid: asGrid
	});

	return (
		<div
			role="table"
			id={id}
			className={rootElementClassName}
			style={style}
			data-testid={testId}
		>
			{children}
		</div>
	);
};
