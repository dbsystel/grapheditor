import './RootWrapper.scss';
import clsx from 'clsx';
import { Body } from 'src/components/body/Body';
import { ErrorBoundary } from 'src/components/error-boundary/ErrorBoundary';
import { Header } from 'src/components/header/Header';
import { RootWrapperProps } from './RootWrapper.interfaces';

export const RootWrapper = ({ id, className, testId }: RootWrapperProps) => {
	const rootElementClassName = clsx('root-wrapper', className);

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<ErrorBoundary>
				<Header />
			</ErrorBoundary>

			<Body />
		</div>
	);
};
