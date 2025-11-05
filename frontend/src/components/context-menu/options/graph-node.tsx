import { AddLabelsAction } from 'src/components/context-menu/actions/add-labels';
import { AddPropertiesAction } from 'src/components/context-menu/actions/add-properties';
import { RemoveLabelsAction } from 'src/components/context-menu/actions/remove-labels';
import i18n from 'src/i18n';
import { useClipboardStore } from 'src/stores/clipboard';
import { useContextMenuStore } from 'src/stores/context-menu';
import { AddRelationAction } from '../actions/add-relation';
import { applyLayoutToFollowingNodesAction } from '../actions/apply-layout-to-following-nodes';
import { collapseNodeAction } from '../actions/collapse-node';
import { copyAction } from '../actions/copy';
import { deleteNodesAction } from '../actions/delete-nodes';
import { expandNodeAction } from '../actions/expand-node';
import { hideNodesAction } from '../actions/hide-nodes';
import { loadPerspectiveNodeAction } from '../actions/load-perspective-node';
import { PastePropertiesAction } from '../actions/paste-properties';
import { ContextMenuAction, ContextMenuOption } from '../ContextMenu.interfaces';

export const graphNodeOptions = (): Partial<Record<ContextMenuAction, ContextMenuOption>> => {
	const nodeId = useContextMenuStore.getState().nodeIds.at(0);

	if (!nodeId) {
		return {};
	}

	return {
		copy: {
			label: i18n.t('context_menu_copy'),
			onClick: () => {
				copyAction([nodeId], [], 'graph');
			}
		},
		add_labels: {
			label: i18n.t('context_menu_add_labels'),
			subMenuRenderer: (goBack) => <AddLabelsAction goBack={goBack} />
		},
		remove_labels: {
			label: i18n.t('context_menu_remove_labels'),
			subMenuRenderer: (goBack) => <RemoveLabelsAction goBack={goBack} />
		},
		add_properties: {
			label: i18n.t('context_menu_add_properties'),
			subMenuRenderer: (goBack) => <AddPropertiesAction goBack={goBack} />
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
		},
		hide: {
			label: i18n.t('context_menu_hide'),
			onClick: () => {
				hideNodesAction([nodeId]);
			}
		},
		expand: {
			label: i18n.t('context_menu_expand'),
			onClick: () => {
				expandNodeAction(nodeId);
			},
			shouldRender: () => {
				return !useContextMenuStore.getState().isNodeExpanded(nodeId);
			}
		},
		collapse: {
			label: i18n.t('context_menu_collapse'),
			onClick: () => {
				collapseNodeAction(nodeId);
			},
			shouldRender: () => {
				return useContextMenuStore.getState().isNodeExpanded(nodeId);
			}
		},
		load_perspective: {
			label: i18n.t('context_menu_perspective_load'),
			onClick: () => {
				loadPerspectiveNodeAction(nodeId);
			}
		},
		add_relation: {
			label: i18n.t('context_menu_add_relation'),
			subMenuRenderer: (goBack) => <AddRelationAction nodeId={nodeId} goBack={goBack} />
		},
		apply_layout_to_following_nodes: {
			label: i18n.t('context_menu_apply_layout_to_following_nodes'),
			options: [
				{
					label: i18n.t('context_menu_apply_layout_to_following_nodes_horizontal'),
					onClick: () => {
						applyLayoutToFollowingNodesAction(nodeId, 'horizontal');
					}
				},
				{
					label: i18n.t('context_menu_apply_layout_to_following_nodes_vertical'),
					onClick: () => {
						applyLayoutToFollowingNodesAction(nodeId, 'vertical');
					}
				}
			]
		}
	};
};
