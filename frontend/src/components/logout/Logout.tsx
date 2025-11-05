import { DBButton } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { destroyApplicationStoresObservers } from 'src/observers';
import { useLoginStore } from 'src/stores/login';
import { useNotificationsStore } from 'src/stores/notifications';
import { usersApi } from 'src/utils/api/users';
import { resetApplicationStates } from 'src/utils/helpers/general';
import { LogoutProps } from './Logout.interfaces';

export const Logout = ({ withLabel, id, className, testId }: LogoutProps) => {
	const addNotification = useNotificationsStore((store) => store.addNotification);
	const { disconnect } = useLoginStore((state) => state);
	const { t } = useTranslation();
	const rootElementClassName = clsx('logout', className);

	const onDisconnect = () => {
		usersApi.postLogout().then(() => {
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
			variant="filled"
			onClick={onDisconnect}
		>
			{withLabel ? 'Disconnect' : ''}Logout
		</DBButton>
	);
};
