/// <reference types="vitest" />
import { playwright } from '@vitest/browser-playwright';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfigFn from './vite.config';

// Vite 8: mergeConfig no longer accepts callback-form configs — resolve first
const viteConfig = viteConfigFn({
	command: 'serve',
	mode: process.env.NODE_ENV ?? 'test',
	isSsrBuild: false
});

export default mergeConfig(
	viteConfig,
	defineConfig({
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
				provider: playwright({
					launchOptions: {
						// We added this because of sigma.js after updating playwright and playwright-chromium from version 1.57.0 to version 1.58.2
						args: ['--use-gl=angle']
					}
				}),
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
		}
	})
);
