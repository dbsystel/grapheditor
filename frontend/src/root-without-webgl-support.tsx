import { createRoot } from 'react-dom/client';
import { NoWebGLSupport } from 'src/components/no-webgl-support/NoWebGLSupport';

export const rootWithoutWebGLSupport = () => {
	// https://react.dev/reference/react-dom/client/createRoot
	const root = createRoot(document.getElementById('root')!);

	// TODO discuss enabling the strict mode
	root.render(
		// <StrictMode>
		<NoWebGLSupport />
		// </StrictMode>
	);
};
