import { TAB_CREATED_AT_STORAGE_KEY, TAB_ID_STORAGE_KEY } from 'src/utils/constants';

export const getTabId = () => {
	return window.sessionStorage.getItem(TAB_ID_STORAGE_KEY);
};

export const setTabId = (tabId: string) => {
	window.sessionStorage.setItem(TAB_ID_STORAGE_KEY, tabId);
};

export const removeTabId = () => {
	window.sessionStorage.removeItem(TAB_ID_STORAGE_KEY);
};

export const getTabCreatedAt = () => {
	return window.sessionStorage.getItem(TAB_CREATED_AT_STORAGE_KEY);
};

// use milliseconds since the epoch (unix)
export const setTabCreatedAt = (createdAt: number) => {
	window.sessionStorage.setItem(TAB_CREATED_AT_STORAGE_KEY, createdAt.toString());
};
