import 'src/assets/scss/main.scss';
import '../i18n';
import { cleanup } from 'vitest-browser-react';
import { server } from './server';

// TODO consider adding "vi.useFakeTimers({ shouldAdvanceTime: true });" to
//  "beforeEach/All" and "vi.useRealTimers();" to "afterEach/All"

beforeAll(async () => {
	await server.start({ quiet: true });
});

afterEach(() => {
	cleanup();
	server.resetHandlers();
});

afterAll(() => {
	server.stop();
});
