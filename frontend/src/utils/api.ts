import axios from 'axios';

const { protocol, hostname, port, pathname } = window.location;

export const backendApi = axios.create({
	baseURL: `${protocol}//${hostname}:${import.meta.env.VITE_BACKEND_PORT || port}${pathname}api`,
	withCredentials: true
});

export const frontendApi = axios.create({
	baseURL: `${protocol}//${hostname}:${port}${pathname}`,
	withCredentials: true
});

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
