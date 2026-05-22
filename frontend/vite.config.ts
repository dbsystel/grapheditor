import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import svgr from 'vite-plugin-svgr';
import { generateSbom, processLicenses, removeDataTestIdAttribute } from './vite.plugins';

export default defineConfig({
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
			src: path.resolve(__dirname, './src')
		}
	},
	build: {
		sourcemap: true,
		cssMinify: 'esbuild'
	},
	base: './'
});
