import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

const isCI = !!process.env.CI;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: './src/tests/e2e',
	outputDir: './playwright-screenshots',
	/* Run tests in files sequentially */
	fullyParallel: false,
	/* Fail the build if you accidentally left test.only in the source code. */
	forbidOnly: true,
	/* No retries – tests should be stable */
	retries: 0,
	/* Run tests sequentially – E2E tests share a database */
	workers: 1,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: 'html',

	// 	/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
	// 	trace: 'on-first-retry'
	// },

	use: {
		baseURL: process.env.BASE_URL || 'http://localhost:8080',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
		viewport: {
			width: 1920,
			height: 1080
		}
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: 'Microsoft Edge',
			use: {
				permissions: ['clipboard-read', 'clipboard-write'], // https://playwright.dev/docs/api/class-browsercontext#browser-context-grant-permissions
				channel: isCI ? undefined : 'msedge', // ← 'msedge' launches installed Edge instead of bundled Chromium
				launchOptions: {
					args: [
						'--enable-webgl', // enables WebGL
						...(isCI ? ['--use-gl=angle', '--use-angle=swiftshader'] : [])
					]
				}
			}
		}
	],

	webServer: {
		command: 'npm run dev',
		url: 'http://localhost:8080',
		reuseExistingServer: true,
		timeout: 120 * 1000
	}
});
