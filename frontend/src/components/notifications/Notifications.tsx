import './Notifications.style.scss';
import { DBNotification } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNotificationsStore } from 'src/stores/notifications';
import { NotificationProps, NotificationsProps } from './Notifications.interfaces';

export const Notifications = ({ id, className, testId }: NotificationsProps) => {
	const notifications = useNotificationsStore((store) => store.notifications);
	const dialogRef = useRef<HTMLDialogElement>(null);
	const rootElementClassName = clsx('notifications', className);

	useEffect(() => {
		const dialogElement = dialogRef.current;

		if (dialogElement) {
			if (notifications.length) {
				// don't use the "showModal" method, it will prevent clicking
				// on anything outside the root element
				dialogElement.show();
			} else {
				dialogElement.close();
			}
		}
	}, [dialogRef.current, notifications]);

	return createPortal(
		<dialog
			id={id}
			className={rootElementClassName}
			ref={dialogRef}
			data-backdrop="none"
			data-testid={testId}
		>
			<div className="notifications__container">
				{notifications.map((notification) => (
					<Notification key={notification.id} notification={notification} />
				))}
			</div>
		</dialog>,
		document.body
	);
};

const Notification = ({ notification }: NotificationProps) => {
	const { title, description, type, onClose, isClosable } = notification;
	const removeNotification = useNotificationsStore((store) => store.removeNotification);

	const onCloseLocal = () => {
		removeNotification(notification.id);

		if (onClose) {
			onClose();
		}
	};

	return (
		<div className="notifications__notification">
			<DBNotification
				headline={title}
				semantic={type}
				onClose={onCloseLocal}
				closeable={isClosable}
			>
				{description}
			</DBNotification>
		</div>
	);
};
