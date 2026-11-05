import axios, { AxiosInstance } from 'axios';
import { useLoadingRequestsStore } from 'src/stores/loading-requests';
import { useStoppableRequestsStore } from 'src/stores/stoppable-requests';
import { STOPPABLE_REQUEST_HEADER_KEY } from 'src/utils/constants';
import { isString } from 'src/utils/helpers/general';

const { protocol, hostname, port, pathname } = window.location;

export const backendApi = axios.create({
	baseURL: `${protocol}//${hostname}:${import.meta.env.VITE_BACKEND_PORT || port}${pathname}api`,
	withCredentials: true
});

export const frontendApi = axios.create({
	baseURL: `${protocol}//${hostname}:${port}${pathname}`,
	withCredentials: true
});

registerStoppableRequestInterceptors(backendApi);

registerLoadingInterceptors(backendApi);
registerLoadingInterceptors(frontendApi);

/** Set the tabId currently sent with each request as a custom x-tab-id header
 *
 * @param tabId string
 */
export const setApiHeaderTabId = (tabId: string) => {
	backendApi.defaults.headers['x-tab-id'] = tabId;
	frontendApi.defaults.headers['x-tab-id'] = tabId;
};

export const removeApiHeaderTabId = () => {
	backendApi.defaults.headers['x-tab-id'] = null;
	frontendApi.defaults.headers['x-tab-id'] = null;
};

/** Set the tabId currently used as a template for new tabId. Needed only for log in check process.
 *
 * @param templateTabId string
 */
export const setApiHeaderTemplateTabId = (templateTabId: string) => {
	backendApi.defaults.headers['x-template-tab-id'] = templateTabId;
};

export const removeApiHeaderTemplateTabId = () => {
	backendApi.defaults.headers['x-template-tab-id'] = null;
};

function registerStoppableRequestInterceptors(instance: AxiosInstance) {
	instance.interceptors.request.use((request) => {
		const { applicationStoppableRequest } = request;

		if (applicationStoppableRequest) {
			request.signal = applicationStoppableRequest.abortController.signal;
			request.headers[STOPPABLE_REQUEST_HEADER_KEY] = applicationStoppableRequest.id;

			useStoppableRequestsStore.getState().addStoppableRequest(applicationStoppableRequest);
		}

		return request;
	});

	instance.interceptors.response.use(
		(response) => {
			const stoppableRequestHeaderId = response.config.headers[STOPPABLE_REQUEST_HEADER_KEY];

			if (isString(stoppableRequestHeaderId)) {
				useStoppableRequestsStore
					.getState()
					.removeStoppableRequest(stoppableRequestHeaderId);
			}

			return response;
		},
		(error) => {
			const stoppableRequestHeaderId = error.config.headers[STOPPABLE_REQUEST_HEADER_KEY];

			if (isString(stoppableRequestHeaderId)) {
				useStoppableRequestsStore
					.getState()
					.removeStoppableRequest(stoppableRequestHeaderId);
			}

			return Promise.reject(error);
		}
	);
}

/**
 * Register request/response interceptors that track each request as a loading action in the
 * application store.
 */
function registerLoadingInterceptors(instance: AxiosInstance) {
	instance.interceptors.request.use((request) => {
		const loadingRequestId = window.crypto.randomUUID();
		request.applicationLoadingRequestId = loadingRequestId;

		useLoadingRequestsStore.getState().startLoadingRequest(loadingRequestId);

		return request;
	});

	instance.interceptors.response.use(
		(response) => {
			const loadingRequestId = response.config.applicationLoadingRequestId;
			if (loadingRequestId) {
				useLoadingRequestsStore.getState().finishLoadingRequest(loadingRequestId);
			}

			return response;
		},
		(error) => {
			const loadingRequestId = error?.config.applicationLoadingRequestId;
			if (loadingRequestId) {
				useLoadingRequestsStore.getState().finishLoadingRequest(loadingRequestId);
			}

			return Promise.reject(error);
		}
	);
}
