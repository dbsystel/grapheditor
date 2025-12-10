import { clearCanvasContexts } from 'src/components/network-graph/helpers';

export const checkBrowserRenderingCapabilities = () => {
	// consider https://www.npmjs.com/package/detect-gpu
	const canvas = document.createElement('canvas');
	const result: { webglAvailable: boolean; softwareRendering: null | boolean; renderer: string } =
		{
			webglAvailable: false,
			softwareRendering: null, // null: cannot determine, true/false: detected
			renderer: '' // string with renderer info
		};

	try {
		const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

		if (gl && gl instanceof WebGLRenderingContext) {
			result.webglAvailable = true;

			const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
			if (debugInfo) {
				const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
				result.renderer = renderer.toString();

				const lowerRenderer = renderer.toLowerCase();

				// angle (google, vulkan 1.3.0 (swiftshader device (subzero) (0x0000c0de)), swiftshader driver)
				// the list is probably not complete, use with caution
				if (
					lowerRenderer.includes('swiftshader') ||
					lowerRenderer.includes('llvmpipe') ||
					lowerRenderer.includes('software') ||
					lowerRenderer.includes('mesa')
				) {
					result.softwareRendering = true;
				} else {
					result.softwareRendering = false;
				}
			}

			clearCanvasContexts([canvas]);
		}
	} catch {
		/* empty */
	}

	return result;
};
