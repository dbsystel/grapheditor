import { http, passthrough } from 'msw';
import { setupWorker } from 'msw/browser';
import { successfulNodeHandlers } from 'src/tests/handlers/nodes';
import { successfulRelationsHandlers } from 'src/tests/handlers/relations';

export const server = setupWorker(
	...successfulNodeHandlers,
	...successfulRelationsHandlers,
	// ignore requests pointing to node_modules (fetching static files)
	http.get('/node_modules/*', () => {
		return passthrough();
	})
);
