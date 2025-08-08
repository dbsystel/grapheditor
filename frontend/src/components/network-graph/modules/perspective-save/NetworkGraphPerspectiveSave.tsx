import { DBButton } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { NodePositions } from 'src/models/perspective';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';
import { useNotificationsStore } from 'src/stores/notifications';
import { usePutPerspective } from 'src/utils/hooks/usePutPerspective';
import { NetworkGraphPerspectiveSaveProps } from './NetworkGraphPerspectiveSave.interfaces';

export const NetworkGraphPerspectiveSave = ({
	onSuccess,
	id,
	className,
	testId
}: NetworkGraphPerspectiveSaveProps) => {
	const { t } = useTranslation();
	const addNotification = useNotificationsStore((store) => store.addNotification);
	const { perspectiveId, perspectiveName, sigma } = useGraphStore((store) => store);
	const setNodePosition = useItemsStore((store) => store.setNodePosition);
	const { reFetch } = usePutPerspective({
		perspectiveId: perspectiveId || '',
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
		}
	});
	const rootElementClassName = clsx('network-graph__perspective-save', className);

	const savePerspective = () => {
		const graph = sigma.getGraph();
		const nodePositions: NodePositions = {};

		graph.forEachNode((nodeId, attributes) => {
			nodePositions[nodeId] = {
				x: attributes.x,
				y: attributes.y,
				z: 0
			};

			/* Update node data in memory, instead of reloading the graph from server.
			 * Important for layout change.
			 */
			setNodePosition(
				{ id: nodeId, x: attributes.x, y: attributes.y, z: attributes.z },
				true
			);
		});

		if (perspectiveId) {
			reFetch({
				perspectiveId: perspectiveId,
				perspectiveName: perspectiveName || '',
				nodePositions: nodePositions,
				relationIds: graph.edges()
			});
		}
	};

	const SaveButton = () => {
		if (!perspectiveId) {
			return;
		}
		return (
			<DBButton
				onClick={savePerspective}
				type="button"
				size="small"
				width="full"
				variant="neutral"
				icon="save"
				id={id}
				className={rootElementClassName}
				data-testid={testId}
			>
				{t('perspective_save')}
			</DBButton>
		);
	};

	return <SaveButton />;
};
