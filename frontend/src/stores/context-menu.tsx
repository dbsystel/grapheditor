import { MouseEvent } from 'react';
import { SigmaEdgeEventPayload, SigmaNodeEventPayload, SigmaStageEventPayload } from 'sigma/types';
import {
	ContextMenuAction,
	ContextMenuOption
} from 'src/components/context-menu/ContextMenu.interfaces';
import { graphCanvasOptions } from 'src/components/context-menu/options/graph-canvas';
import { graphMultiselectOptions } from 'src/components/context-menu/options/graph-multiselect';
import { graphNodeOptions } from 'src/components/context-menu/options/graph-node';
import { graphRelationOptions } from 'src/components/context-menu/options/graph-relation';
import { nodeOptions } from 'src/components/context-menu/options/node';
import { NodeId } from 'src/models/node';
import { RelationId } from 'src/models/relation';
import { create } from 'zustand';

type ContextMenuType =
	| 'node'
	| 'graph-node'
	| 'graph-relation'
	| 'graph-multiselect'
	| 'graph-canvas'
	| '';

type ContextMenuEventType<T = ContextMenuType> = T extends 'node'
	? MouseEvent
	: T extends 'graph-node'
		? SigmaNodeEventPayload
		: T extends 'graph-relation'
			? SigmaEdgeEventPayload
			: T extends 'graph-multiselect'
				? SigmaNodeEventPayload | SigmaEdgeEventPayload
				: T extends 'graph-canvas'
					? SigmaStageEventPayload
					: null;

type ContextMenuStore<T = ContextMenuType> = {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	type: T;
	nodeIds: Array<NodeId>;
	relationIds: Array<RelationId>;
	x: number;
	y: number;
	event: ContextMenuEventType<T>;
	getOptions: () => Partial<Record<ContextMenuAction, ContextMenuOption>>;
	open: ({
		x,
		y,
		type,
		event,
		nodeIds,
		relationIds,
		onClose
	}: {
		x?: number;
		y?: number;
		type: T;
		event: ContextMenuEventType<T>;
		nodeIds?: Array<NodeId>;
		relationIds?: Array<RelationId>;
		onClose?: (() => void) | null;
	}) => void;
	close: () => void;
	onClose: (() => void) | null;
	reset: () => void;
	resetButExclude: (excludeKeys: Array<keyof InitialState>) => void;
	// to be used when an action needs to perform async work (e.g. performing data fetch and similar)
	isActionLoading: boolean;
	setIsActionLoading: (isActionLoading: boolean) => void;
};

type InitialState = Omit<
	ContextMenuStore,
	| 'setIsOpen'
	| 'getOptions'
	| 'open'
	| 'close'
	| 'reset'
	| 'resetButExclude'
	| 'setIsActionLoading'
>;

const getInitialState: () => InitialState = () => {
	return {
		isOpen: false,
		type: '',
		event: null,
		nodeIds: [],
		relationIds: [],
		x: 0,
		y: 0,
		onClose: null,
		isActionLoading: false
	};
};

/**
 * A simple context menu store.
 */
export const useContextMenuStore = create<ContextMenuStore>()((set, get) => {
	return {
		...getInitialState(),
		setIsOpen: (isOpen) => {
			set({ isOpen: isOpen });
		},
		getOptions: () => {
			const type = get().type;

			if (type === 'node') {
				return nodeOptions();
			} else if (type === 'graph-relation') {
				return graphRelationOptions();
			} else if (type === 'graph-canvas') {
				return graphCanvasOptions();
			} else if (type === 'graph-multiselect') {
				return graphMultiselectOptions();
			} else if (type === 'graph-node') {
				return graphNodeOptions();
			}

			return {};
		},
		open: (data) => {
			const nodeIds = data.nodeIds || [];
			const relationIds = data.relationIds || [];

			set({ ...data, isOpen: true, nodeIds: nodeIds, relationIds: relationIds });
		},
		close: () => {
			set({
				isOpen: false,
				type: '',
				event: null,
				nodeIds: [],
				relationIds: [],
				x: 0,
				y: 0,
				onClose: null,
				isActionLoading: false
			});
		},
		setIsActionLoading: (isActionLoading) => {
			set({
				isActionLoading: isActionLoading
			});
		},
		reset: () => {
			set(getInitialState());
		},
		resetButExclude: (excludeKeys) => {
			const state: Partial<InitialState> = getInitialState();

			excludeKeys.forEach((key) => {
				delete state[key];
			});

			set(state);
		}
	};
});

(window as any).useContextMenuStore = useContextMenuStore;
