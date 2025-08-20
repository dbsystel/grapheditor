import 'src/assets/scss/main.scss';
import { createRoot } from 'react-dom/client';
import { App } from 'src/App';
import {
	onCaughtError,
	onRecoverableError,
	onUncaughtError,
	onWindowError,
	onWindowUnhandledRejection
} from 'src/utils/errors/errors';

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

// TODO discuss enabling the strict mode
root.render(
	// <StrictMode>
	<App />
	// </StrictMode>
);
