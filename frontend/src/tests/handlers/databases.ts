import { http, HttpResponse } from 'msw';
import { TEST_HOST } from 'src/tests/constants';
import { endpoints } from 'src/utils/endpoints';

export const successfulDatabaseHandlers = [
	http.get(TEST_HOST + endpoints.getDatabasesPath(), () => {
		return HttpResponse.json({
			databases: [
				{
					name: 'neo4j',
					status: 'online'
				}
			]
		});
	}),

	http.get(TEST_HOST + endpoints.getDatabasesCurrentPath(), () => {
		return HttpResponse.json({
			name: 'neo4j',
			status: 'online'
		});
	})
];
