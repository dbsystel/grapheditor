import { AddLabelsAction } from 'src/components/context-menu/actions/add-labels';
import { AddPropertiesAction } from 'src/components/context-menu/actions/add-properties';
import { applyLayoutAction } from 'src/components/context-menu/actions/apply-layout';
import { RemoveLabelsAction } from 'src/components/context-menu/actions/remove-labels';
import i18n from 'src/i18n';
import { useContextMenuStore } from 'src/stores/context-menu';
import { copyAction } from '../actions/copy';
import { deleteNodesAction } from '../actions/delete-nodes';
import { deleteRelationsAction } from '../actions/delete-relations';
import { exportNodesAndTheirRelationsAsImageAction } from '../actions/export-nodes-and-relations-as-image';
import { hideNodesAction } from '../actions/hide-nodes';
import { hideRelationsAction } from '../actions/hide-relations';
import { ContextMenuAction, ContextMenuOption } from '../ContextMenu.interfaces';

export const graphMultiselectOptions = (): Partial<
	Record<ContextMenuAction, ContextMenuOption>
> => {
	const nodeIds = useContextMenuStore.getState().nodeIds;
	const relationIds = useContextMenuStore.getState().relationIds;

	return {
		hide: {
			label: i18n.t('context_menu_hide'),
			onClick: () => {
				hideNodesAction(nodeIds);
			},
			shouldRender: () => nodeIds.length > 0
		},
		hide_relations: {
			label: i18n.t('context_menu_hide_relations'),
			onClick: () => {
				hideRelationsAction(relationIds);
			},
			shouldRender: () => relationIds.length > 0
		},
		delete: {
			label: i18n.t('context_menu_delete'),
			onClick: () => {
				deleteNodesAction(nodeIds);
			},
			shouldRender: () => nodeIds.length > 0
		},
		delete_relations: {
			label: i18n.t('context_menu_delete_relations'),
			onClick: () => {
				deleteRelationsAction(relationIds);
			},
			shouldRender: () => relationIds.length > 0
		},
		copy: {
			label: i18n.t('context_menu_copy'),
			onClick: () => {
				copyAction(nodeIds, relationIds, 'graph');
			}
		},
		copy_nodes: {
			label: i18n.t('context_menu_copy_nodes'),
			onClick: () => {
				copyAction(nodeIds, [], 'graph');
			},
			shouldRender: () => nodeIds.length > 0
		},
		add_labels: {
			label: i18n.t('context_menu_add_labels'),
			subMenuRenderer: (goBack) => <AddLabelsAction goBack={goBack} />,
			shouldRender: () => nodeIds.length > 0
		},
		remove_labels: {
			label: i18n.t('context_menu_remove_labels'),
			subMenuRenderer: (goBack) => <RemoveLabelsAction goBack={goBack} />,
			shouldRender: () => nodeIds.length > 0
		},
		add_properties: {
			label: i18n.t('context_menu_add_properties'),
			subMenuRenderer: (goBack) => <AddPropertiesAction goBack={goBack} />
		},
		apply_layout: {
			label: i18n.t('context_menu_apply_layout'),
			options: [
				{
					label: i18n.t('context_menu_apply_layout_horizontal'),
					onClick: () => applyLayoutAction('horizontal')
				},
				{
					label: i18n.t('context_menu_apply_layout_vertical'),
					onClick: () => applyLayoutAction('vertical')
				}
			],
			shouldRender: () => nodeIds.length > 0
		},
		export: {
			label: i18n.t('context_menu_export'),
			options: [
				{
					label: 'PNG',
					onClick: () => {
						exportNodesAndTheirRelationsAsImageAction(nodeIds, 'image/png');
					}
				},
				{
					label: 'JPEG',
					onClick: () => {
						exportNodesAndTheirRelationsAsImageAction(nodeIds, 'image/jpeg');
					}
				}
			]
		}
	};
};
