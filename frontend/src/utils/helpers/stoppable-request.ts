import i18n from 'src/i18n';
import { StoppableRequest } from 'src/models/stoppable-request';
import { useNotificationsStore } from 'src/stores/notifications';
import { api } from 'src/utils/api/api';

export const createStoppableRequestConfiguration = (
	defaultConfiguration?: Partial<StoppableRequest>
): StoppableRequest => {
	return {
		tags: defaultConfiguration?.tags || [],
		id: defaultConfiguration?.id || window.crypto.randomUUID(),
		abortController: defaultConfiguration?.abortController || new AbortController(),
		shouldRenderNotificationOnSuccess:
			defaultConfiguration?.shouldRenderNotificationOnSuccess || false
	};
};

export const cancelStoppableRequest = (stoppableRequest: StoppableRequest) => {
	stoppableRequest.abortController.abort();

	api.requests.fetch.deleteRequest({ requestId: stoppableRequest.id }).then((response) => {
		if (stoppableRequest.shouldRenderNotificationOnSuccess) {
			if (response.status === 299) {
				useNotificationsStore.getState().addNotification({
					title: i18n.t('notifications_info_header_request_already_processed'),
					type: 'informational'
				});
			} else {
				useNotificationsStore.getState().addNotification({
					title: i18n.t('notifications_success_header_request_stop'),
					type: 'successful'
				});
			}
		}
	});
};
