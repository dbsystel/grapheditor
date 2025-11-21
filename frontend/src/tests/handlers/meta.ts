import { http, HttpResponse } from 'msw';
import { TEST_HOST } from 'src/tests/constants';
import { endpoints } from 'src/utils/endpoints';

export const successfulMetaHandlers = [
	// won't be for now, just intercept the endpoint
	http.post(TEST_HOST + endpoints.getMetaForMetaPath(), () => {
		return HttpResponse.json({
			nodes: {}
		});
	})
];
