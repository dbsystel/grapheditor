import { DBButton } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useGraphStore } from 'src/stores/graph';
import { useNotificationsStore } from 'src/stores/notifications';
import { useSearchStore } from 'src/stores/search';
import { nodesApi } from 'src/utils/api/nodes';
import { processPerspective } from 'src/utils/helpers/nodes';
import { useGetStyleReset } from 'src/utils/hooks/useGetStyleReset';
import { NetworkGraphStyleResetProps } from './NetworkGraphStyleReset.interfaces';

export const NetworkGraphStyleReset = ({
	onSuccess,
	id,
	className,
	testId
}: NetworkGraphStyleResetProps) => {
	const { t } = useTranslation();
	const addNotification = useNotificationsStore((store) => store.addNotification);
	const { setIsLoading, perspectiveId } = useGraphStore((state) => state);
	const searchStore = useSearchStore((store) => store);

	const { isLoading, reFetch } = useGetStyleReset({
		onSuccess: async () => {
			if (onSuccess) {
				onSuccess();
			}

			addNotification({
				title: t('notifications_info_grass_file_reset_success'),
				type: 'successful'
			});

			searchStore.setResetStyles(true);

			if (perspectiveId) {
				nodesApi
					.getPerspective({ perspectiveId: perspectiveId })
					.then((response) => processPerspective(response.data));
			}
		},
		onError: (error) => {
			addNotification({
				title: t('notifications_info_grass_file_reset_failure'),
				description: error.message,
				type: 'critical'
			});
		},
		onFinally: () => {
			setIsLoading(false);
		}
	});
	const rootElementClassName = clsx('network-graph__style-reset', className);

	const resetGrassFile = () => {
		setIsLoading(true);
		reFetch();
	};

	return (
		<DBButton
			onClick={resetGrassFile}
			type="button"
			disabled={isLoading}
			size="small"
			width="full"
			variant="brand"
			icon="circular_arrows"
			id={id}
			className={rootElementClassName}
			data-testid={testId}
		>
			{t('style_reset_button')}
		</DBButton>
	);
};
