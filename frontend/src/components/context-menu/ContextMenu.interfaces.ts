import { JSX } from 'react';
import { ContextMenuActionType } from 'src/utils/fetch/postContextMenuActions';

export type ContextMenuOption = {
	label: string;
	onClick?: () => void;
	subMenuRenderer?: (goBack: () => void) => JSX.Element;
	options?: Array<ContextMenuOption>;
	shouldRender?: () => boolean;
};

export type ContextMenuAction =
	| 'hide'
	| 'delete'
	| 'expand'
	| 'collapse'
	| 'copy'
	| 'paste'
	| 'add_relation'
	| 'apply_layout_to_following_nodes'
	| 'load_perspective'
	| 'hide_relations'
	| 'delete_relations'
	| 'copy_nodes'
	| 'apply_layout'
	| 'add_labels'
	| 'add_properties'
	| 'export'
	| 'save_as_perspective'
	| 'add_node'
	| 'add_to_perspective'
	| 'move_copied'
	| 'duplicate_copied'
	| 'hide_with_filter';

export type NodeContextMenuAction = Extract<ContextMenuAction, 'copy' | 'paste' | 'delete'>;

export type NetworkGraphNodeContextMenuAction = Extract<
	ContextMenuAction,
	| 'copy'
	| 'paste'
	| 'delete'
	| 'hide'
	| 'expand'
	| 'add_relation'
	| 'apply_layout_to_following_nodes'
	| 'load_perspective'
>;

export type ContextMenuState = {
	internal: Partial<Record<ContextMenuAction, ContextMenuOption>>;
	fromServer: Array<ContextMenuActionType>;
};
