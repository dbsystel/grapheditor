import { http, passthrough } from 'msw';
import { setupWorker } from 'msw/browser';
import { successfulDatabaseHandlers } from 'src/tests/handlers/databases';
import { successfulMetaHandlers } from 'src/tests/handlers/meta';
import { successfulNodeHandlers } from 'src/tests/handlers/nodes';
import { successfulParaQueriesHandlers } from 'src/tests/handlers/paraqueries';
import { successfulPerspectiveHandlers } from 'src/tests/handlers/perspectives';
import { successfulRelationsHandlers } from 'src/tests/handlers/relations';
import { successfulStylesHandlers } from 'src/tests/handlers/styles';

export const worker = setupWorker(
	...successfulNodeHandlers,
	...successfulRelationsHandlers,
	...successfulPerspectiveHandlers,
	...successfulStylesHandlers,
	...successfulDatabaseHandlers,
	...successfulParaQueriesHandlers,
	...successfulMetaHandlers,
	// ignore requests pointing to node_modules (fetching static files)
	http.get('/node_modules/*', () => {
		return passthrough();
	})
);
