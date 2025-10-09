import { http, HttpResponse } from 'msw';
import { TEST_HOST } from 'src/tests/constants';

export const successfulPerspectiveHandlers = [
	http.put(TEST_HOST + '/v1/perspectives/:id', async () => {
		return HttpResponse.json({ message: 'Perspective updated' });
	}),
	http.post(TEST_HOST + '/v1/perspectives', async () => {
		return HttpResponse.json({ message: 'Perspective created' });
	})
];
