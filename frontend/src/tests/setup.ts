import 'src/assets/scss/main.scss';
import '../i18n';
import { cleanup } from 'vitest-browser-react';
import { worker } from './worker';

// TODO consider adding "vi.useFakeTimers({ shouldAdvanceTime: true });" to
//  "beforeEach/All" and "vi.useRealTimers();" to "afterEach/All"

// TODO this is executed on each test file, fix it to run only once before all tests and once after
//  all tests (https://vitest.dev/config/#globalsetup doesn't work properly due to different context)
beforeAll(async () => {
	await worker.start({ quiet: true });
});

afterEach(() => {
	cleanup();
	worker.resetHandlers();
});

afterAll(() => {
	worker.stop();
});
