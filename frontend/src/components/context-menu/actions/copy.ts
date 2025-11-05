import i18n from 'src/i18n';
import { NodeId } from 'src/models/node';
import { RelationId } from 'src/models/relation';
import { useClipboardStore } from 'src/stores/clipboard';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';
import { useNotificationsStore } from 'src/stores/notifications';

export const copyAction = (
	nodeIds: Array<NodeId>,
	relationIds: Array<RelationId>,
	type: 'default' | 'graph'
) => {
	if (type === 'default') {
		useClipboardStore.getState().writeToClipboard({
			nodes: useItemsStore.getState().getStoreNodes(nodeIds),
			relations: useItemsStore.getState().getStoreRelations(relationIds)
		});
	} else if (type === 'graph') {
		useClipboardStore.getState().writeToClipboard({
			graphNodes: Array.from(useGraphStore.getState().sigma.getGraph().nodeEntries()).filter(
				(nodeEntry) => {
					return nodeIds.includes(nodeEntry.node);
				}
			),
			graphRelations: Array.from(
				useGraphStore.getState().sigma.getGraph().edgeEntries()
			).filter((relationEntry) => {
				return relationIds.includes(relationEntry.edge);
			})
		});
	}

	useNotificationsStore.getState().addNotification({
		title: i18n.t('notifications_success_copy_items', {
			nodeCount: useClipboardStore.getState().getAvailableNodes().length,
			relationCount: useClipboardStore.getState().getAvailableRelations().length
		}),
		type: 'successful'
	});
	useContextMenuStore.getState().close();
};
