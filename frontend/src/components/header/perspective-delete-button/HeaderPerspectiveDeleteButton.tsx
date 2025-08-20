import './HeaderPerspectiveDeleteButton.scss';
import { DBButton } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'src/i18n';
import { useDrawerStore } from 'src/stores/drawer';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';
import { useNotificationsStore } from 'src/stores/notifications';
import { useSearchStore } from 'src/stores/search';
import { nodesApi } from 'src/utils/api/nodes';
import { GRAPH_LAYOUT_FORCE_ATLAS_2 } from 'src/utils/constants';
import { HeaderPerspectiveDeleteButtonProps } from './HeaderPerspectiveDeleteButton.interfaces';

export const HeaderPerspectiveDeleteButton = ({
	closeMenuFunction,
	perspectiveId,
	id,
	className,
	testId
}: HeaderPerspectiveDeleteButtonProps) => {
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const addNotification = useNotificationsStore((store) => store.addNotification);
	const setAlgorithm = useSearchStore((store) => store.setAlgorithm);
	const rootElementClassName = clsx('header__perspective-delete-button', className);

	const perspectiveDelete = () => {
		setIsLoading(true);

		nodesApi
			.deleteNodesAndUpdateApplication([perspectiveId])
			.then((response) => {
				if (response.num_deleted > 0) {
					useDrawerStore.getState().removeEntryByItemId(perspectiveId);
					useGraphStore.getState().removeNode(perspectiveId);
					useItemsStore.getState().removeNode(perspectiveId, true);

					addNotification({
						title: i18n.t('notifications_success_perspective_delete'),
						type: 'successful'
					});

					useGraphStore.getState().setPerspectiveId(null);
					useGraphStore.getState().setPerspectiveName(null);

					setAlgorithm(GRAPH_LAYOUT_FORCE_ATLAS_2);
				}
			})
			.finally(() => {
				setIsLoading(false);
				closeMenuFunction();
			});
	};

	return (
		<DBButton
			onClick={perspectiveDelete}
			type="button"
			width="full"
			variant="ghost"
			id={id}
			className={rootElementClassName}
			data-testid={testId}
			disabled={isLoading}
		>
			{t('header_delete_perspective')}
		</DBButton>
	);
};
