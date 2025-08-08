import './RootWrapper.scss';
import clsx from 'clsx';
import { RootWrapperProps } from './RootWrapper.interfaces';

export const RootWrapper = ({ children, id, className, testId }: RootWrapperProps) => {
	const rootElementClassName = clsx('root-wrapper', className);

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{children}
		</div>
	);
};
