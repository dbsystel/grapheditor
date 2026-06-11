import './i18n';
import { BrowserRouter } from 'react-router-dom';
import { Auth } from 'src/components/auth/Auth';
import { ConfirmationModal } from 'src/components/confirmation-modal/ConfirmationModal';
import { ContextMenu } from 'src/components/context-menu/ContextMenu';
import { ErrorBoundary } from 'src/components/error-boundary/ErrorBoundary';
import { ItemOverviewsRenderer } from 'src/components/item-overviews-renderer/ItemOverviewsRenderer';
import { Notifications } from 'src/components/notifications/Notifications';
import { RootWrapper } from 'src/components/root-wrapper/RootWrapper';
import { useSearchStore } from 'src/stores/search';
import { useSettingsStore } from 'src/stores/settings';
import { setApplicationTheme } from 'src/utils/helpers/application';
import { initializeKeyboardObserver } from 'src/utils/keyboard-observer';

useSearchStore.getState().initialize();
setApplicationTheme(useSettingsStore.getState().theme);
initializeKeyboardObserver();

export const App = () => {
	return (
		<BrowserRouter>
			<ErrorBoundary>
				<Auth>
					<RootWrapper />
					<ErrorBoundary>
						<ContextMenu />
					</ErrorBoundary>
					<ErrorBoundary>
						<ConfirmationModal />
					</ErrorBoundary>
				</Auth>
			</ErrorBoundary>

			<ErrorBoundary>
				<Notifications />
			</ErrorBoundary>
			<ErrorBoundary>
				<ItemOverviewsRenderer />
			</ErrorBoundary>
		</BrowserRouter>
	);
};
