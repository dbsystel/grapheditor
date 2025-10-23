import 'src/assets/scss/main.scss';
import { lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { NoWebGLSupport } from 'src/components/no-webgl-support/NoWebGLSupport';
import {
	onCaughtError,
	onRecoverableError,
	onUncaughtError,
	onWindowError,
	onWindowUnhandledRejection
} from 'src/utils/errors/errors';
import { checkBrowserRenderingCapabilities } from 'src/utils/helpers/general';

/**
 * Important to lazy-load due to WebGL support check. Since Zustand stores are initialized on import
 * (this makes them always and everywhere within project available), we first need to check for WebGL
 * support before the graph store is initialized.
 */
const App = lazy(() =>
	import('src/App').then((module) => {
		return {
			default: module['App']
		};
	})
);

// https://react.dev/reference/react-dom/client/createRoot
const root = createRoot(
	document.getElementById('root')!,
	// try and handle React errors
	// https://react.dev/reference/react-dom/client/createRoot#parameters
	{
		onCaughtError: onCaughtError,
		onUncaughtError: onUncaughtError,
		onRecoverableError: onRecoverableError
	}
);

// try and handle uncaught errors
window.addEventListener('error', onWindowError);
window.addEventListener('unhandledrejection', onWindowUnhandledRejection);

const renderingCapabilities = checkBrowserRenderingCapabilities();
const RootComponent = renderingCapabilities.webglAvailable ? App : NoWebGLSupport;

// TODO discuss enabling the strict mode
root.render(
	// <StrictMode>
	<RootComponent />
	// </StrictMode>
);
