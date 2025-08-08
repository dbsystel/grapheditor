import './Form.scss';
import clsx from 'clsx';
import { FormProps } from './Form.interfaces';

export const Form = ({
	onSubmit,
	id,
	className,
	testId,
	children,
	disableImplicitSubmission = true
}: FormProps) => {
	const rootElementClassName = clsx('form', className);

	return (
		<form id={id} className={rootElementClassName} onSubmit={onSubmit} data-testid={testId}>
			{disableImplicitSubmission && (
				<button
					type="submit"
					disabled
					style={{ display: 'none' }}
					aria-hidden="true"
				></button>
			)}
			{children}
		</form>
	);
};
