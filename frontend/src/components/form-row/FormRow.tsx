import './FormRow.scss';
import clsx from 'clsx';
import { FormRowProps } from './FormRow.interfaces';

export const FormRow = ({ id, className, testId, children }: FormRowProps) => {
	const rootElementClassName = clsx('form__row', className);

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{children}
		</div>
	);
};
