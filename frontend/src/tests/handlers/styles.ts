import { http, HttpResponse } from 'msw';
import { TEST_HOST } from 'src/tests/constants';
import { endpoints } from 'src/utils/endpoints';

export const successfulStylesHandlers = [
	http.get(TEST_HOST + endpoints.getStylesCurrentPath(), () => {
		// Note that you DON'T have to stringify the JSON!
		return HttpResponse.json({
			filename: ''
		});
	}),

	http.get(TEST_HOST + endpoints.getStylesPath(), () => {
		return HttpResponse.json({
			filenames: []
		});
	})
];
