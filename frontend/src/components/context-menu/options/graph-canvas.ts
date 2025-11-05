import { addNodeAction } from 'src/components/context-menu/actions/add-node';
import { duplicateCopiedAction } from 'src/components/context-menu/actions/duplicate-copied';
import { exportNodesAndTheirRelationsAsImageAction } from 'src/components/context-menu/actions/export-nodes-and-relations-as-image';
import { hideNodesAction } from 'src/components/context-menu/actions/hide-nodes';
import { moveCopiedAction } from 'src/components/context-menu/actions/move-copied';
import { showAllAction } from 'src/components/context-menu/actions/show-all';
import i18n from 'src/i18n';
import { useGraphStore } from 'src/stores/graph';
import { ContextMenuAction, ContextMenuOption } from '../ContextMenu.interfaces';

export const graphCanvasOptions = (): Partial<Record<ContextMenuAction, ContextMenuOption>> => {
	return {
		add_node: {
			label: i18n.t('context_menu_add_node'),
			onClick: addNodeAction
		},
		duplicate_copied: {
			label: i18n.t('context_menu_duplicate_copied'),
			onClick: duplicateCopiedAction
		},
		move_copied: {
			label: i18n.t('context_menu_move_copied'),
			onClick: moveCopiedAction
		},
		export: {
			label: i18n.t('context_menu_export'),
			options: [
				{
					label: 'PNG',
					onClick: () => {
						exportNodesAndTheirRelationsAsImageAction(
							useGraphStore.getState().sigma.getGraph().nodes(),
							'image/png'
						);
					}
				},
				{
					label: 'JPEG',
					onClick: () => {
						exportNodesAndTheirRelationsAsImageAction(
							useGraphStore.getState().sigma.getGraph().nodes(),
							'image/jpeg'
						);
					}
				}
			]
		},
		hide: {
			label: i18n.t('context_menu_hide_all'),
			onClick: () => {
				hideNodesAction(useGraphStore.getState().sigma.getGraph().nodes());
			}
		},
		show: {
			label: i18n.t('context_menu_show_all'),
			onClick: showAllAction
		}
	};
};
