import { DBButton } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useGraphStore } from 'src/stores/graph';
import { useNotificationsStore } from 'src/stores/notifications';
import { preparePerspectiveDataAndRefreshNodesPosition } from 'src/utils/helpers/perspectives';
import { usePutPerspective } from 'src/utils/hooks/usePutPerspective';
import { HeaderPerspectiveSaveButtonProps } from './HeaderPerspectiveSaveButton.interfaces';

export const HeaderPerspectiveSaveButton = ({
	onSuccess,
	perspectiveId,
	id,
	className,
	testId,
	closeMenuFunction
}: HeaderPerspectiveSaveButtonProps) => {
	const { t } = useTranslation();
	const addNotification = useNotificationsStore((store) => store.addNotification);
	const { perspectiveName } = useGraphStore((store) => store);
	const { reFetch, isLoading } = usePutPerspective({
		perspectiveId: perspectiveId,
		perspectiveName: perspectiveName || '',
		nodePositions: {},
		relationIds: [],
		onSuccess: async () => {
			if (onSuccess) {
				onSuccess();
			}

			addNotification({
				title: t('notifications_success_perspective_update'),
				type: 'successful'
			});
		},
		onFinally: closeMenuFunction
	});
	const rootElementClassName = clsx('header__perspective-save-button', className);

	const savePerspective = () => {
		const { nodePositions, relationIds } = preparePerspectiveDataAndRefreshNodesPosition();

		reFetch({
			perspectiveId: perspectiveId,
			perspectiveName: perspectiveName || '',
			nodePositions: nodePositions,
			relationIds: relationIds
		});
	};

	return (
		<DBButton
			onClick={savePerspective}
			type="button"
			width="full"
			variant="ghost"
			id={id}
			className={rootElementClassName}
			data-testid={testId}
			disabled={isLoading}
		>
			{t('header_save_current_perspective')}
		</DBButton>
	);
};
