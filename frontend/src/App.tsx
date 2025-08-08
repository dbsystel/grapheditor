import './i18n';
import { BrowserRouter } from 'react-router-dom';
import { Auth } from 'src/components/auth/Auth';
import { ContextMenu } from 'src/components/context-menu/ContextMenu';
import { ErrorBoundary } from 'src/components/error-boundary/ErrorBoundary';
import { ItemsDrawer } from 'src/components/items-drawer/ItemsDrawer';
import { Notifications } from 'src/components/notifications/Notifications';
import { RootWrapper } from 'src/components/root-wrapper/RootWrapper';
import { useSearchStore } from 'src/stores/search';
import { useSettingsStore } from 'src/stores/settings';
import { setApplicationTheme } from 'src/utils/helpers/general';
import { initializeKeyboardObserver } from 'src/utils/keyboard-observer';
import { Header } from './components/header/Header';
import { MainVisual } from './components/main-visual/MainVisual';
import { MenuDrawer } from './components/menu-drawer/MenuDrawer';

useSearchStore.getState().initialize();
initializeKeyboardObserver();
setApplicationTheme(useSettingsStore.getState().theme);

export const App = () => {
	return (
		<BrowserRouter>
			<ErrorBoundary>
				<Auth>
					<RootWrapper className="db-bg-color-basic-level-2">
						<ErrorBoundary>
							<Header />
						</ErrorBoundary>

						<ErrorBoundary>
							<MainVisual />
						</ErrorBoundary>
					</RootWrapper>
					<ErrorBoundary>
						<ContextMenu />
					</ErrorBoundary>
					<ErrorBoundary>
						<ItemsDrawer />
					</ErrorBoundary>
					<ErrorBoundary>
						<MenuDrawer />
					</ErrorBoundary>
				</Auth>
			</ErrorBoundary>

			<ErrorBoundary>
				<Notifications />
			</ErrorBoundary>
		</BrowserRouter>
	);
};
