import { ReactNode } from 'react';
import { NotificationType } from 'src/components/notifications/Notifications.interfaces';
import { NOTIFICATIONS_AUTOCLOSE_MILLISECONDS } from 'src/utils/constants';
import { create } from 'zustand';

type Notification = {
	title: string;
	description?: ReactNode;
	type: NotificationType;
	onClose?: () => void;
	// auto-close disabled if this is set to 0
	autoCloseAfterMilliseconds?: number;
	// the isClosable attribute shows/hides the close button on the top right.
	isClosable?: boolean;
};

export type StoreNotification = Notification & {
	id: string;
	autoCloseAfterMilliseconds: number;
};

type NotificationsStore = {
	notifications: Array<StoreNotification>;
	addNotification: (notification: Notification) => StoreNotification;
	removeNotification: (notificationId: string) => void;
};

/**
 * Store for storing and showing notifications. For more info, please check the
 * /notifications/Notifications.tsx component.
 */
export const useNotificationsStore = create<NotificationsStore>()((set) => {
	return {
		notifications: [],
		addNotification: (notification) => {
			const storeNotification = createStoreNotification(notification);

			set((state) => {
				if (storeNotification.autoCloseAfterMilliseconds > 0) {
					setTimeout(() => {
						state.removeNotification(storeNotification.id);

						if (storeNotification.onClose) {
							storeNotification.onClose();
						}
					}, storeNotification.autoCloseAfterMilliseconds);
				}

				return {
					notifications: [...state.notifications, storeNotification]
				};
			});

			return storeNotification;
		},
		removeNotification: (notificationId) => {
			set((state) => {
				return {
					notifications: state.notifications.filter((notification) => {
						return notification.id !== notificationId;
					})
				};
			});
		}
	};
});

function createStoreNotification(notification: Notification): StoreNotification {
	return {
		...notification,
		id: window.crypto.randomUUID(),
		autoCloseAfterMilliseconds:
			notification.autoCloseAfterMilliseconds ?? NOTIFICATIONS_AUTOCLOSE_MILLISECONDS
	};
}
