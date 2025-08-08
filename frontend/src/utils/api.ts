import axios from 'axios';

export const backendApi = axios.create({
	baseURL: `${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_BACKEND_PORT || window.location.port}/api`,
	withCredentials: true
});

/** Set the tabId currently sent with each request as a custom x-tab-id header
 *
 * @param tabId string
 */
export const setApiHeaderTabId = (tabId: string) => {
	backendApi.defaults.headers['x-tab-id'] = tabId;
};

export const removeApiHeaderTabId = () => {
	backendApi.defaults.headers['x-tab-id'] = null;
};
