import './LeftWidgetPresentation.scss';
import { ErrorBoundary } from 'src/components/error-boundary/ErrorBoundary';
import { GraphOptions } from 'src/components/graph-options/GraphOptions';
import { NetworkGraphStyleReset } from 'src/components/network-graph/modules/style-reset/NetworkGraphStyleReset';
import { NetworkGraphStyleUpload } from 'src/components/network-graph/modules/style-upload/NetworkGraphStyleUpload';
import { useSearchStore } from 'src/stores/search';

export const LeftWidgetPresentation = () => {
	const onStyleSuccess = () => {
		useSearchStore.getState().executeSearch();
	};

	return (
		<ErrorBoundary>
			<GraphOptions />
			<NetworkGraphStyleUpload onSuccess={onStyleSuccess} />
			<NetworkGraphStyleReset onSuccess={onStyleSuccess} />
		</ErrorBoundary>
	);
};
