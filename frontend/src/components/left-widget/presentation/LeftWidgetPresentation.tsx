import './LeftWidgetPresentation.scss';
import { ErrorBoundary } from 'src/components/error-boundary/ErrorBoundary';
import { GraphOptions } from 'src/components/graph-options/GraphOptions';

export const LeftWidgetPresentation = () => {
	return (
		<ErrorBoundary>
			<GraphOptions />
		</ErrorBoundary>
	);
};
