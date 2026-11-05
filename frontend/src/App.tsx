import './i18n';
import { BrowserRouter } from 'react-router-dom';
import { Auth } from 'src/components/auth/Auth';
import { ConfirmationModal } from 'src/components/confirmation-modal/ConfirmationModal';
import { ContextMenu } from 'src/components/context-menu/ContextMenu';
import { ErrorBoundary } from 'src/components/error-boundary/ErrorBoundary';
import { ImportExportModals } from 'src/components/import-export-modals/ImportExportModals';
import { ItemOverviewsRenderer } from 'src/components/item-overviews-renderer/ItemOverviewsRenderer';
import { Notifications } from 'src/components/notifications/Notifications';
import { RootWrapper } from 'src/components/root-wrapper/RootWrapper';
import { useSearchStore } from 'src/stores/search';
import { useSettingsStore } from 'src/stores/settings';
import { useTabStore } from 'src/stores/tab';
import { setApplicationTheme } from 'src/utils/helpers/application';
import { initalizeCustomAuthHeaders } from 'src/utils/helpers/auth';
import { initializeKeyboardObserver } from 'src/utils/keyboard-observer';

useTabStore.getState().initialize();
initalizeCustomAuthHeaders();
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
					<ErrorBoundary>
						<ImportExportModals />
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
