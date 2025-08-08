import { StoreNotification } from 'src/stores/notifications';
import { GlobalComponentProps } from 'src/types/components';

export type NotificationsProps = GlobalComponentProps;

export type NotificationProps = {
	notification: StoreNotification;
};

export type NotificationType = 'informational' | 'critical' | 'successful' | 'warning';
