import { DBButton } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useLoginStore } from 'src/stores/login';
import { useNotificationsStore } from 'src/stores/notifications';
import { postLogout } from 'src/utils/fetch/postLogout';
import { LogoutProps } from './Logout.interfaces';

export const Logout = ({ withLabel, id, className, testId }: LogoutProps) => {
	const addNotification = useNotificationsStore((store) => store.addNotification);
	const { disconnect } = useLoginStore((state) => state);
	const { t } = useTranslation();
	const rootElementClassName = clsx('logout', className);

	const onDisconnect = () => {
		postLogout().then(() => {
			disconnect();

			addNotification({
				title: t('notifications_success_logout'),
				type: 'successful'
			});
		});
	};

	return (
		<DBButton
			id={id}
			className={rootElementClassName}
			data-testid={testId}
			type="button"
			icon="log_out"
			variant="brand"
			onClick={onDisconnect}
			noText
		>
			{withLabel ? 'Disconnect' : ''}
		</DBButton>
	);
};
