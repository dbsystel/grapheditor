import { http, HttpResponse } from 'msw';
import { TEST_HOST } from 'src/tests/constants';
import { testParaQueries } from 'src/tests/data/paraqueries';
import { endpoints } from 'src/utils/endpoints';

export const successfulParaQueriesHandlers = [
	http.get(TEST_HOST + endpoints.getParaQueriesPath(), () => {
		return HttpResponse.json({
			paraqueries: testParaQueries
		});
	})
];
