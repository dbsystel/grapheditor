/// <reference types="vitest" />
/// <reference types='@vitest/browser-playwright' />
import react from '@vitejs/plugin-react';
import path from 'path';
import checker from 'vite-plugin-checker';
import svgr from 'vite-plugin-svgr';
import { defineConfig } from 'vitest/config';
import { generateSbom, processLicenses, removeDataTestIdAttribute } from './vite.plugins';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
	plugins: [react(), removeDataTestIdAttribute(), svgr(), checker({ typescript: true }), processLicenses(), generateSbom()],
	server: {
		port: 8080,
		open: true
	},
	optimizeDeps: {
		include: ['react-dom/client', 'source-map-js']
	},
	test: {
		globals: true,
		include: [
			'src/components/**/*.test.ts',
			'src/components/**/*.test.tsx',
			'src/utils/**/*.test.ts',
			'src/utils/**/*.test.tsx'
		],
		setupFiles: ['src/tests/setup.ts'],
		coverage: {
			include: ['src/components/**/*.tsx']
		},
		// parallel test execution caused issues on MacOS ¯\_(ツ)_/¯
		maxConcurrency: 1,
		fileParallelism: false,
		restoreMocks: true,
		browser: {
			enabled: true,
			provider: playwright(),
			instances: [
				{
					browser: 'chromium'
				}
			],
			viewport: {
				width: 1920,
				height: 1080
			},
			headless: true,
			screenshotFailures: false
		}
	},
	resolve: {
		// In order to make absolute imports (e.g. "import xy from "src/xy") work we need to
		// define an alias from "src" to the actual "src" directory.
		alias: {
			src: path.resolve(__dirname, './src')
		}
	},
	build: {
		sourcemap: true
	},
	base: './'
});
