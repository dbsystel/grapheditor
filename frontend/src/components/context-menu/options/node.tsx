import {
	ContextMenuAction,
	ContextMenuOption
} from 'src/components/context-menu/ContextMenu.interfaces';
import i18n from 'src/i18n';
import { useClipboardStore } from 'src/stores/clipboard';
import { useContextMenuStore } from 'src/stores/context-menu';
import { copyAction } from '../actions/copy';
import { deleteNodesAction } from '../actions/delete-nodes';
import { PastePropertiesAction } from '../actions/paste-properties';

export const nodeOptions = (): Partial<Record<ContextMenuAction, ContextMenuOption>> => {
	const nodeId = useContextMenuStore.getState().nodeIds.at(0);

	if (!nodeId) {
		return {};
	}

	return {
		copy: {
			label: i18n.t('context_menu_copy'),
			onClick: () => {
				copyAction([nodeId], [], 'default');
			}
		},
		paste_properties: {
			label: i18n.t('context_menu_paste_properties'),
			subMenuRenderer: (goBack) => (
				<PastePropertiesAction pasteToId={nodeId} goBack={goBack} />
			),
			shouldRender: () => !useClipboardStore.getState().isClipboardEmpty()
		},
		delete: {
			label: i18n.t('context_menu_delete'),
			onClick: () => {
				deleteNodesAction([nodeId]);
			}
		}
	};
};
