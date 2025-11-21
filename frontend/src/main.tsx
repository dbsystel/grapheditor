import 'src/assets/scss/layers.scss';
import 'src/assets/scss/main.scss';
import { checkBrowserRenderingCapabilities } from 'src/utils/helpers/browser';

/**
 * Important to lazy-load due to WebGL support check. Since Zustand stores are initialized on import
 * (this makes them always and everywhere within project available), we first need to check for WebGL
 * support before the graph store is initialized, which means before the app runs. SigmaJS requires
 * WebGL or the app will fail to start, without us being able to show any message to the user that
 * something went wrong.
 */
(async () => {
	const renderingCapabilities = checkBrowserRenderingCapabilities();
	let runRoot;

	if (renderingCapabilities.webglAvailable) {
		const module = await import('src/root-with-webgl-support');

		runRoot = module.rootWithWebglSupport;
	} else {
		const module = await import('src/root-without-webgl-support');

		runRoot = module.rootWithoutWebGLSupport;
	}

	runRoot();
})();
