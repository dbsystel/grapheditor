const tabIdKey = 'tabId';

export const getTabId = () => {
	return window.sessionStorage.getItem(tabIdKey);
};

export const setTabId = (tabId: string) => {
	window.sessionStorage.setItem(tabIdKey, tabId);
};

export const removeTabId = () => {
	window.sessionStorage.removeItem(tabIdKey);
};
