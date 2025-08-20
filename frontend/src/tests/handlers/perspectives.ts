import { http, HttpResponse } from 'msw';
import { TEST_HOST } from 'src/tests/constants';

export let perspectiveUpdateCalled = 0;
export let perspectiveCreateCalled = 0;

export const resetPerspectiveCounters = () => {
	perspectiveUpdateCalled = 0;
	perspectiveCreateCalled = 0;
};

export const successfulPerspectiveHandlers = [
	http.put(TEST_HOST + '/v1/perspectives/:id', async () => {
		perspectiveUpdateCalled++;
		return HttpResponse.json({ message: 'Perspective updated' });
	}),
	http.post(TEST_HOST + '/v1/perspectives', async () => {
		perspectiveCreateCalled++;
		return HttpResponse.json({ message: 'Perspective created' });
	})
];
