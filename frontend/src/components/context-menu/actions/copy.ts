import i18n from 'src/i18n';
import { NodeId } from 'src/models/node';
import { RelationId } from 'src/models/relation';
import { useClipboardStore } from 'src/stores/clipboard';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useItemsStore } from 'src/stores/items';
import { useNotificationsStore } from 'src/stores/notifications';

export const copyAction = (nodeIds: Array<NodeId>, relationIds: Array<RelationId>) => {
	const nodes = useItemsStore.getState().getStoreNodes(nodeIds);
	const relations = useItemsStore.getState().getStoreRelations(relationIds);

	useClipboardStore.getState().writeToClipboard(nodes, relations);
	useNotificationsStore.getState().addNotification({
		title: i18n.t('notifications_success_copy_items'),
		type: 'successful'
	});
	useContextMenuStore.getState().close();
};
