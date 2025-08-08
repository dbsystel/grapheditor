import i18n from 'src/i18n';
import { NodeId } from 'src/models/node';
import { RelationId } from 'src/models/relation';
import { useClipboardStore } from 'src/stores/clipboard';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useItemsStore } from 'src/stores/items';
import { useNotificationsStore } from 'src/stores/notifications';
import { patchNode } from 'src/utils/fetch/patchNode';
import { patchRelation } from 'src/utils/fetch/patchRelation';
import { isNode } from 'src/utils/helpers/nodes';

export const pasteAction = (pasteToId: NodeId | RelationId, actionExecutedInGraph?: boolean) => {
	const pasteTo = useItemsStore.getState().getStoreItem(pasteToId);

	const collection =
		useClipboardStore.getState().clipboard[isNode(pasteTo) ? 'nodes' : 'relations'];
	const clipboardItem = collection.at(0);

	if (clipboardItem && pasteTo) {
		if (
			pasteTo._grapheditor_type !== clipboardItem._grapheditor_type ||
			pasteTo.id === clipboardItem.id
		) {
			console.warn(
				`Paste not possible, source and target type mismatch. The clipboard element type ${clipboardItem._grapheditor_type} doesn't match the paste element type ${pasteTo._grapheditor_type}`
			);
			return;
		}

		// ToDo: check if we should overwrite properties or not
		pasteTo.properties = {
			...pasteTo.properties,
			...clipboardItem.properties
		};

		const patchApi = isNode(pasteTo)
			? patchNode.bind(null, {
					nodeId: pasteTo.id,
					properties: pasteTo.properties
				})
			: patchRelation.bind(null, {
					relationId: pasteTo.id,
					properties: pasteTo.properties
				});
		const successNotificationTitle = isNode(pasteTo)
			? 'notifications_success_node_update'
			: 'notifications_success_relation_update';
		const errorNotificationTitle = isNode(pasteTo)
			? 'notifications_failure_node_update'
			: 'notifications_failure_relation_update';

		patchApi().then(() => {
			useContextMenuStore.getState().close();
			useNotificationsStore.getState().addNotification({
				title: i18n.t(successNotificationTitle),
				type: 'successful'
			});
		});

		if (!actionExecutedInGraph) {
			useItemsStore.getState().setItem(pasteTo);
		} else {
			// Todo
		}
	}
};
