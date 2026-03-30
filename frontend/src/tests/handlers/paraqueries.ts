import { http, HttpResponse } from 'msw';
import { TEST_HOST } from 'src/tests/constants';
import { testParaQueries, testParaQueriesResponse } from 'src/tests/data/paraqueries';
import { endpoints } from 'src/utils/endpoints';
import { isString } from 'src/utils/helpers/general';

export const successfulParaQueriesHandlers = [
	http.get(TEST_HOST + endpoints.getParaQueriesPath() + '/:paraQueryId', ({ params }) => {
		const paraQueryId = params['paraQueryId'];
		const testParaQuery = testParaQueries[isString(paraQueryId) ? paraQueryId : ''];

		if (testParaQuery) {
			return HttpResponse.json({
				paraquery: testParaQuery
			});
		} else {
			throw new Error('Test: ParaQuery not found.');
		}
	}),
	http.get(TEST_HOST + endpoints.getParaQueriesPath(), () => {
		return HttpResponse.json(testParaQueriesResponse);
	})
];
