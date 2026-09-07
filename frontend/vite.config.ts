import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import checker from 'vite-plugin-checker';
import svgr from 'vite-plugin-svgr';
import { generateSbom, processLicenses, removeDataTestIdAttribute } from './vite.plugins';

export default defineConfig(({ mode }) => {
	// Theme is resolved at build time from VITE_THEME (.env or shell); defaults to whitelabel.
	const env = loadEnv(mode, process.cwd());
	const theme = env.VITE_THEME || 'whitelabel';

	return {
		plugins: [react(), removeDataTestIdAttribute(), svgr(), checker({ typescript: true }), processLicenses(), generateSbom()],
		server: {
			host: '0.0.0.0',
			port: 8080,
			open: true,
			proxy: {
				'/api/files/': {
					target: 'http://localhost:4999',
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
				src: path.resolve(__dirname, './src'),
				'@theme': path.resolve(__dirname, `./src/assets/themes/${theme}`),
				'@db-ux': path.resolve(__dirname, './node_modules/@db-ux')
			}
		},
		build: {
			sourcemap: true,
			cssMinify: true
		},
		base: './'
	};
});
