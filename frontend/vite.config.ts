import react from '@vitejs/plugin-react';
import { msw } from 'msw/vite';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import checker from 'vite-plugin-checker';
import svgr from 'vite-plugin-svgr';
import { generateSbom, processLicenses, removeDataTestIdAttribute } from './vite.plugins.ts';

export default defineConfig(({ mode }) => {
	// Theme is resolved at build time from VITE_THEME (.env or shell); defaults to whitelabel.
	const env = loadEnv(mode, process.cwd());
	const theme = env.VITE_THEME || 'whitelabel';
	// defaults to the regular dev backend port; overridden to the e2e backend port via
	// playwright.config.ts, which sets VITE_BACKEND_PORT on the spawned dev server process
	const backendPort = env.VITE_BACKEND_PORT || '4999';

	return {
		plugins: [
			react(),
			removeDataTestIdAttribute(),
			svgr(),
			checker({ typescript: true }),
			processLicenses(),
			generateSbom(),
			msw({ mode: 'worker-only' })
		],
		server: {
			host: '0.0.0.0',
			port: 8080,
			open: true,
			proxy: {
				'/api/files/': {
					target: `http://localhost:${backendPort}`,
					changeOrigin: true
				}
			}
		},
		optimizeDeps: {
			include: ['react-dom/client', 'source-map-js']
		},
		resolve: {
			// In order to make absolute imports (e.g. "import xy from "src/xy") work we need to
			// define an alias from "src" to the actual "src" directory.
			alias: {
				src: path.resolve(import.meta.dirname, './src'),
				'@theme': path.resolve(import.meta.dirname, `./src/assets/themes/${theme}`),
				'@db-ux': path.resolve(import.meta.dirname, './node_modules/@db-ux')
			}
		},
		build: {
			sourcemap: true,
			cssMinify: 'esbuild'
		},
		base: './'
	};
});
