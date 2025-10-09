import './i18n';
import { BrowserRouter } from 'react-router-dom';
import { Auth } from 'src/components/auth/Auth';
import { ContextMenu } from 'src/components/context-menu/ContextMenu';
import { ErrorBoundary } from 'src/components/error-boundary/ErrorBoundary';
import { Notifications } from 'src/components/notifications/Notifications';
import { RootWrapper } from 'src/components/root-wrapper/RootWrapper';
import { initializeSearchStoreObservers } from 'src/observers/search';
import { useSearchStore } from 'src/stores/search';
import { useSettingsStore } from 'src/stores/settings';
import { setApplicationTheme } from 'src/utils/helpers/general';
import { initializeKeyboardObserver } from 'src/utils/keyboard-observer';

useSearchStore.getState().initialize();
setApplicationTheme(useSettingsStore.getState().theme);
initializeKeyboardObserver();
initializeSearchStoreObservers();

export const App = () => {
	return (
		<BrowserRouter>
			<ErrorBoundary>
				<Auth>
					<RootWrapper />
					<ErrorBoundary>
						<ContextMenu />
					</ErrorBoundary>
				</Auth>
			</ErrorBoundary>

			<ErrorBoundary>
				<Notifications />
			</ErrorBoundary>
		</BrowserRouter>
	);
};
