import './PrintObject.scss';
import clsx from 'clsx';
import { Fragment } from 'react';
import { PrintObjectProps } from './PrintObject.interfaces';

export const PrintObject = ({ object, id, className, testId }: PrintObjectProps) => {
	const rootElementClassName = clsx('print-object', className);

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{Object.entries(object).map(([key, value]) => (
				<Fragment key={key}>
					<div className="print-object__object-key">{key}:</div>
					<div className="print-object__object-value">{String(value)}</div>
				</Fragment>
			))}
		</div>
	);
};
