import { http, passthrough } from 'msw';
import { setupWorker } from 'msw/browser';

import { successfulNodeHandlers } from 'src/tests/handlers/nodes';
import { successfulRelationsHandlers } from 'src/tests/handlers/relations';
import { successfulPerspectiveHandlers } from 'src/tests/handlers/perspectives';

export const worker = setupWorker(
	...successfulNodeHandlers,
	...successfulRelationsHandlers,
	...successfulPerspectiveHandlers,
	// ignore requests pointing to node_modules (fetching static files)
	http.get('/node_modules/*', () => {
		return passthrough();
	})
);
