import { DBButton } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { NodePositions } from 'src/models/perspective';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';
import { useNotificationsStore } from 'src/stores/notifications';
import { usePostPerspective } from 'src/utils/hooks/usePostPerspective';
import { NetworkGraphPerspectiveSaveAsProps } from './NetworkGraphPerspectiveSaveAs.interfaces';

export const NetworkGraphPerspectiveSaveAs = ({
	onSuccess,
	id,
	className,
	testId
}: NetworkGraphPerspectiveSaveAsProps) => {
	const { t } = useTranslation();
	const addNotification = useNotificationsStore((store) => store.addNotification);
	const { sigma } = useGraphStore((store) => store);
	const setNodePosition = useItemsStore((store) => store.setNodePosition);
	const { reFetch } = usePostPerspective({
		name: '',
		nodePositions: {},
		relationIds: [],
		onSuccess: async () => {
			if (onSuccess) {
				onSuccess();
			}

			addNotification({
				title: t('notifications_success_perspective_create'),
				type: 'successful'
			});
		}
	});
	const rootElementClassName = clsx('network-graph__perspective-save-as', className);

	const savePerspective = (name: string) => {
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

		reFetch({
			name: name,
			nodePositions: nodePositions,
			relationIds: graph.edges()
		});
	};

	const askForName = () => {
		const name = prompt(t('dialog_prompt_for_perspective_name'));
		if (name) {
			savePerspective(name);
		}
	};

	return (
		<DBButton
			onClick={askForName}
			type="button"
			size="small"
			width="full"
			variant="neutral"
			icon="save"
			id={id}
			className={rootElementClassName}
			data-testid={testId}
		>
			{t('perspective_save_as')}
		</DBButton>
	);
};
