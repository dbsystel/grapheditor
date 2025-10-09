import './RootWrapper.scss';
import clsx from 'clsx';
import { Content } from 'src/components/content/Content';
import { ErrorBoundary } from 'src/components/error-boundary/ErrorBoundary';
import { Header } from 'src/components/header/Header';
import { LeftWidget } from 'src/components/left-widget/LeftWidget';
import { RightWidget } from 'src/components/right-widget/RightWidget';
import { RootWrapperProps } from './RootWrapper.interfaces';

export const RootWrapper = ({ id, className, testId }: RootWrapperProps) => {
	const rootElementClassName = clsx('root-wrapper', className);

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<ErrorBoundary>
				<Header />
			</ErrorBoundary>

			<LeftWidget />

			<ErrorBoundary>
				<Content />
			</ErrorBoundary>

			<RightWidget />
		</div>
	);
};
