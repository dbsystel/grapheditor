import { AddRelationForm } from 'src/components/add-relation-form/AddRelationForm';
import { ContextMenuSubMenu } from 'src/components/context-menu/sub-menu/ContextMenuSubMenu';
import { ContextMenuTopBlock } from 'src/components/context-menu/sub-menu/top-block/ContextMenuTopBlock';
import i18n from 'src/i18n';
import { NodeId } from 'src/models/node';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useItemsStore } from 'src/stores/items';
import { useNotificationsStore } from 'src/stores/notifications';

export const AddRelationAction = ({ nodeId, goBack }: { nodeId: NodeId; goBack: () => void }) => {
	const onSave = () => {
		useContextMenuStore.getState().close();
	};

	const node = useItemsStore.getState().getStoreNode(nodeId);

	if (!node) {
		useNotificationsStore.getState().addNotification({
			title: i18n.t('notifications_warning_missing_node_locally', { id: nodeId }),
			type: 'warning'
		});

		useContextMenuStore.getState().close();

		return;
	}

	return (
		<ContextMenuSubMenu className="context-menu__add-relation-action">
			<ContextMenuTopBlock closeSubMenuFunction={goBack} />
			<AddRelationForm refNode={node} onSave={onSave} />
		</ContextMenuSubMenu>
	);
};
