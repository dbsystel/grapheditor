import { http, passthrough } from 'msw';
import { setupWorker } from 'msw/browser';
import { successfulDatabaseHandlers } from 'src/tests/handlers/databases';
import { successfulNodeHandlers } from 'src/tests/handlers/nodes';
import { successfulPerspectiveHandlers } from 'src/tests/handlers/perspectives';
import { successfulRelationsHandlers } from 'src/tests/handlers/relations';
import { successfulStylesHandlers } from 'src/tests/handlers/styles';

export const worker = setupWorker(
	...successfulNodeHandlers,
	...successfulRelationsHandlers,
	...successfulPerspectiveHandlers,
	...successfulStylesHandlers,
	...successfulDatabaseHandlers,
	// ignore requests pointing to node_modules (fetching static files)
	http.get('/node_modules/*', () => {
		return passthrough();
	})
);
