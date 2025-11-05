import { copyAction } from 'src/components/context-menu/actions/copy';
import { deleteRelationsAction } from 'src/components/context-menu/actions/delete-relations';
import { hideRelationsAction } from 'src/components/context-menu/actions/hide-relations';
import { PastePropertiesAction } from 'src/components/context-menu/actions/paste-properties';
import i18n from 'src/i18n';
import { useClipboardStore } from 'src/stores/clipboard';
import { useContextMenuStore } from 'src/stores/context-menu';
import { ContextMenuAction, ContextMenuOption } from '../ContextMenu.interfaces';

export const graphRelationOptions = (): Partial<Record<ContextMenuAction, ContextMenuOption>> => {
	const relationId = useContextMenuStore.getState().relationIds.at(0);

	if (!relationId) {
		return {};
	}

	return {
		copy: {
			label: i18n.t('context_menu_copy'),
			onClick: () => {
				copyAction([], [relationId], 'graph');
			}
		},
		paste_properties: {
			label: i18n.t('context_menu_paste_properties'),
			subMenuRenderer: (goBack) => (
				<PastePropertiesAction pasteToId={relationId} goBack={goBack} />
			),
			shouldRender: () => !useClipboardStore.getState().isClipboardEmpty()
		},
		hide: {
			label: i18n.t('context_menu_hide'),
			onClick: () => hideRelationsAction([relationId])
		},
		delete: {
			label: i18n.t('context_menu_delete'),
			onClick: () => deleteRelationsAction([relationId])
		}
	};
};
