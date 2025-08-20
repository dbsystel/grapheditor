import { SetupWorker } from 'msw/browser';
import { test as testBase } from 'vitest';
import { worker } from './worker';

export const testExtend = testBase.extend<{ worker: SetupWorker }>({
	worker: [
		async ({}, use) => {
			// Start the worker before the test.
			//await worker.start();

			// Expose the worker object on the test's context.
			await use(worker);

			// Remove any request handlers added in individual test cases.
			// This prevents them from affecting unrelated tests.
			worker.resetHandlers();
		},
		{
			auto: true
		}
	]
});
