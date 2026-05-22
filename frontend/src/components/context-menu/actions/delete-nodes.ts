import i18n from 'src/i18n';
import { NodeId } from 'src/models/node';
import { useConfirmationModalStore } from 'src/stores/confirmation-modal';
import { useContextMenuStore } from 'src/stores/context-menu';
import { api } from 'src/utils/api/api';

export const deleteNodesAction = (nodeIds: Array<NodeId>) => {
	useContextMenuStore.getState().close();

	const description =
		nodeIds.length > 1
			? i18n.t('confirm_delete_nodes', { ids: nodeIds.join(', ') })
			: i18n.t('confirm_delete_node', { id: nodeIds[0] });

	useConfirmationModalStore.getState().open({
		title: i18n.t('confirm_delete_node_title'),
		description,
		onCancelClick: () => useConfirmationModalStore.getState().close(),
		onConfirmClick: () => {
			api.nodes.actions.deleteNodesAndUpdateApplication(nodeIds).then(() => {
				useConfirmationModalStore.getState().close();
			});
		},
		confirmLabel: i18n.t('confirm_delete_node_button')
	});
};
