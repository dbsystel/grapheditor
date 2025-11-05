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
import { NodeConnection, NodeId } from 'src/models/node';
import { RelationId } from 'src/models/relation';
import { create } from 'zustand';

type ContextMenuType =
	| 'node'
	| 'graph-node'
	| 'graph-relation'
	| 'graph-multiselect'
	| 'graph-canvas'
	| '';

type ExpandedNodeData = {
	neighbors: Array<NodeConnection>;
	expandedNodes: ExpandedNodes;
};

type NodeAndRelationIds = {
	nodeIds: Array<NodeId>;
	relationIds: Array<RelationId>;
};

export type ExpandedNodes = Map<NodeId, ExpandedNodeData>;

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
	// TODO consider Map instead of Record to preserve order of options
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
	// TODO consider splitting into smaller sub-stores
	//  type "graph-node" data
	expandedNodes: ExpandedNodes;
	addExpandedNode: (nodeId: NodeId, neighbors: Array<NodeConnection>) => void;
	removeExpandedNode: (nodeId: NodeId) => void;
	getExpandedNodeData: (nodeId: NodeId) => ExpandedNodeData | null;
	getExpandedNodeNodeAndRelationIds: (nodeId: NodeId) => NodeAndRelationIds;
	isNodeExpanded: (nodeId: NodeId) => boolean;
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
	| 'addExpandedNode'
	| 'removeExpandedNode'
	| 'getExpandedNodeData'
	| 'getExpandedNodeNodeAndRelationIds'
	| 'isNodeExpanded'
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
		expandedNodes: new Map(),
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
				// TODO discuss if we should prevent closing the context menu if "isActionLoading"
				//  is set to "true"
				isActionLoading: false
			});
		},
		addExpandedNode: (nodeId, neighbors) => {
			const expandedNodeData = get().getExpandedNodeData(nodeId);

			if (expandedNodeData) {
				neighbors.forEach((neighbor) => {
					expandedNodeData.expandedNodes.set(neighbor.neighbor.id, {
						neighbors: [],
						expandedNodes: new Map()
					});
				});
				expandedNodeData.neighbors = neighbors;
			} else {
				const expandedNodesMap: ExpandedNodes = new Map();

				neighbors.forEach((neighbor) => {
					expandedNodesMap.set(neighbor.neighbor.id, {
						neighbors: [],
						expandedNodes: new Map()
					});
				});

				get().expandedNodes.set(nodeId, {
					neighbors: neighbors,
					expandedNodes: expandedNodesMap
				});
			}
		},
		isNodeExpanded: (nodeId) => {
			const expandedNodeData = get().getExpandedNodeData(nodeId);

			if (!expandedNodeData) {
				return false;
			}

			return expandedNodeData.expandedNodes.size > 0;
		},
		getExpandedNodeData: (nodeId) => {
			let expandedNodeData: ExpandedNodeData | null = null;

			const searchForExpandedNodeData = (map: ExpandedNodes) => {
				const levelNodeExpanded = map.get(nodeId);

				if (levelNodeExpanded) {
					expandedNodeData = levelNodeExpanded;
					return;
				}

				for (const [key, value] of map) {
					const expandedNodes = value.expandedNodes.get(key);

					if (!expandedNodes) {
						searchForExpandedNodeData(value.expandedNodes);
					} else {
						expandedNodeData = expandedNodes;
						break;
					}
				}
			};

			searchForExpandedNodeData(get().expandedNodes);

			return expandedNodeData;
		},
		removeExpandedNode: (nodeId) => {
			const locateAndRemoveExpandedNode = (map: ExpandedNodes) => {
				const expandedNode = map.get(nodeId);

				if (expandedNode) {
					expandedNode.expandedNodes = new Map();
					expandedNode.neighbors = [];

					return;
				}

				for (const [, value] of map) {
					locateAndRemoveExpandedNode(value.expandedNodes);
				}
			};

			locateAndRemoveExpandedNode(get().expandedNodes);
		},
		getExpandedNodeNodeAndRelationIds: (nodeId) => {
			const nodeAndRelationIds: NodeAndRelationIds = {
				nodeIds: [],
				relationIds: []
			};

			const expandedNodeData = get().getExpandedNodeData(nodeId);

			if (expandedNodeData) {
				const getNeighbors = (data: ExpandedNodeData) => {
					if (data.expandedNodes.size) {
						data.neighbors.forEach((neighbor) => {
							nodeAndRelationIds.nodeIds.push(neighbor.neighbor.id);
							nodeAndRelationIds.relationIds.push(neighbor.relation.id);
						});

						data.expandedNodes.forEach((expandedNodeData) => {
							getNeighbors(expandedNodeData);
						});
					}
				};

				getNeighbors(expandedNodeData);

				nodeAndRelationIds.nodeIds = [...new Set(nodeAndRelationIds.nodeIds)];
				nodeAndRelationIds.relationIds = [...new Set(nodeAndRelationIds.relationIds)];
			}

			return nodeAndRelationIds;
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
