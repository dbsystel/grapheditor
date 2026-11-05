import i18n from 'src/i18n';
import { useLoginStore } from 'src/stores/login';
import { useNotificationsStore } from 'src/stores/notifications';
import { useTabStore } from 'src/stores/tab';
import {
	removeApiHeaderTabId,
	removeApiHeaderTemplateTabId,
	setApiHeaderTabId,
	setApiHeaderTemplateTabId
} from 'src/utils/api';
import { removeTabId, setTabId } from 'src/utils/tab-id';

type LogInUserParameters = {
	host: string;
	username: string;
	tabId: string;
};

export const logInUserLocally = ({ host, username, tabId }: LogInUserParameters) => {
	removeApiHeaderTemplateTabId();
	setApiHeaderTabId(tabId);
	setTabId(tabId);
	useLoginStore.getState().connect(host, username);

	useNotificationsStore.getState().addNotification({
		title: i18n.t('notifications_success_login'),
		type: 'successful'
	});
};

export const logOutUserLocally = () => {
	removeApiHeaderTabId();
	removeTabId();
	useLoginStore.getState().disconnect();

	useNotificationsStore.getState().addNotification({
		title: i18n.t('notifications_success_logout'),
		type: 'successful'
	});
};

export const initalizeCustomAuthHeaders = () => {
	const tabData = useTabStore.getState().tabData;

	if (tabData.tabId) {
		if (tabData.scenario === 'duplicate') {
			setApiHeaderTemplateTabId(tabData.tabId);
		} else {
			setApiHeaderTabId(tabData.tabId);
		}
	}
};
