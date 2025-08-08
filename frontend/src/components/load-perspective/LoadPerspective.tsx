import { DBButton } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useNotificationsStore } from 'src/stores/notifications';
import { processPerspective } from 'src/utils/helpers/nodes';
import { useGetPerspective } from 'src/utils/hooks/useGetPerspective';
import { LoadPerspectiveProps } from './LoadPerspective.interfaces';

export const LoadPerspective = ({ perspectiveId, id, className, testId }: LoadPerspectiveProps) => {
	const { t } = useTranslation();
	const addNotification = useNotificationsStore((store) => store.addNotification);
	const rootElementClassName = clsx('load-perspective', className);

	const { reFetch } = useGetPerspective({
		perspectiveId: perspectiveId,
		onSuccess: (response) => processPerspective(response.data),
		onError: (error) => {
			addNotification({
				title: t('notifications_failure_node_fetch'),
				description: error.message,
				type: 'critical'
			});
		}
	});

	const onClick = () => {
		reFetch();
	};

	return (
		<DBButton
			id={id}
			className={rootElementClassName}
			data-testid={testId}
			onClick={onClick}
			type="button"
			size="small"
			width="full"
			variant="ghost"
		>
			{t('perspective_load')}
		</DBButton>
	);
};
