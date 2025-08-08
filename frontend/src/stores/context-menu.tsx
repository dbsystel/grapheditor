import { AddRelationAction } from 'src/components/context-menu/actions/add-relation';
import { applyLayoutToFollowingNodesAction } from 'src/components/context-menu/actions/apply-layout-to-following-nodes';
import { collapseNode } from 'src/components/context-menu/actions/collapse-node';
import { copyAction } from 'src/components/context-menu/actions/copy';
import { deleteNodesAction } from 'src/components/context-menu/actions/delete-nodes';
import { deleteRelationsAction } from 'src/components/context-menu/actions/delete-relations';
import { expandNodeAction } from 'src/components/context-menu/actions/expand-node';
import { exportNodesAndRelationsAsImageAction } from 'src/components/context-menu/actions/export-nodes-and-relations-as-image';
import { hideNodesAction } from 'src/components/context-menu/actions/hide-nodes';
import { hideRelationsAction } from 'src/components/context-menu/actions/hide-relations';
import { loadPerspectiveNodeAction } from 'src/components/context-menu/actions/load-perspective-node';
import { pasteAction } from 'src/components/context-menu/actions/paste';
import {
	ContextMenuAction,
	ContextMenuOption
} from 'src/components/context-menu/ContextMenu.interfaces';
import i18n from 'src/i18n';
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

type ContextMenuStore = {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	type: ContextMenuType;
	nodeIds: Array<NodeId>;
	relationIds: Array<RelationId>;
	x: number;
	y: number;
	getOptions: () => Partial<Record<ContextMenuAction, ContextMenuOption>>;
	open: ({
		x,
		y,
		type,
		nodeIds,
		relationIds,
		onClose
	}: {
		x?: number;
		y?: number;
		type: ContextMenuType;
		nodeIds?: Array<NodeId>;
		relationIds?: Array<RelationId>;
		onClose?: (() => void) | null;
	}) => void;
	close: () => void;
	onClose: (() => void) | null;
	reset: () => void;
	resetButExclude: (excludeKeys: Array<keyof InitialState>) => void;
	// TODO consider splitting into smaller sub-stores
	// type "graph-node" data
	expandedNodes: ExpandedNodes;
	addExpandedNode: (nodeId: NodeId, neighbors: Array<NodeConnection>) => void;
	removeExpandedNode: (nodeId: NodeId) => void;
	getExpandedNodeData: (nodeId: NodeId) => ExpandedNodeData | null;
	getExpandedNodeNodeAndRelationIds: (nodeId: NodeId) => NodeAndRelationIds;
	isNodeExpanded: (nodeId: NodeId) => boolean;
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
>;

const getInitialState: () => InitialState = () => {
	return {
		isOpen: false,
		type: '',
		nodeIds: [],
		relationIds: [],
		x: 0,
		y: 0,
		onClose: null,
		expandedNodes: new Map()
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
			const nodeId = get().nodeIds.at(0);
			const nodeIds = get().nodeIds;
			const relationIds = get().relationIds;
			const t = i18n.t;

			if (type === 'node' && nodeId) {
				return {
					copy: {
						label: t('context_menu_copy'),
						onClick: () => {
							copyAction([nodeId], []);
						}
					},
					paste: {
						label: t('context_menu_paste'),
						onClick: () => {
							pasteAction(nodeId);
						}
					},
					delete: {
						label: t('context_menu_delete'),
						onClick: () => {
							deleteNodesAction([nodeId]);
						}
					}
				};
			} else if (type === 'graph-relation') {
				return {
					hide: {
						label: 'Relation context menu placeholder'
					}
				};
			} else if (type === 'graph-canvas') {
				return {
					add_node: {
						label: 'Canvas context menu placeholder'
					}
				};
			} else if (type === 'graph-multiselect') {
				return {
					hide: {
						label: t('context_menu_hide'),
						onClick: () => {
							hideNodesAction(nodeIds);
						}
					},
					hide_relations: {
						label: t('context_menu_hide_relations'),
						onClick: () => {
							hideRelationsAction(relationIds);
						},
						shouldRender: () => relationIds.length > 0
					},
					delete: {
						label: t('context_menu_delete'),
						onClick: () => {
							deleteNodesAction(nodeIds);
						}
					},
					delete_relations: {
						label: t('context_menu_delete_relations'),
						onClick: () => {
							deleteRelationsAction(relationIds);
						},
						shouldRender: () => relationIds.length > 0
					},
					copy: {
						label: t('context_menu_copy'),
						onClick: () => {
							copyAction(nodeIds, relationIds);
						}
					},
					copy_nodes: {
						label: t('context_menu_copy_nodes'),
						onClick: () => {
							copyAction(nodeIds, []);
						}
					},
					add_to_perspective: {
						label: t('context_menu_add_to_perspective') + ' (TBD)'
					},
					add_labels: {
						label: t('context_menu_add_labels') + ' (TBD)'
					},
					add_properties: {
						label: t('context_menu_add_properties') + ' (TBD)'
					},
					apply_layout: {
						label: t('context_menu_apply_layout') + ' (TBD)'
					},
					save_as_perspective: {
						label: t('context_menu_save_as_perspective') + ' (TBD)'
					},
					export: {
						label: 'WIP -' + t('context_menu_export'),
						options: [
							{
								label: 'PNG',
								onClick: () => {
									exportNodesAndRelationsAsImageAction(nodeIds, 'image/png');
								}
							},
							{
								label: 'JPEG',
								onClick: () => {
									exportNodesAndRelationsAsImageAction(nodeIds, 'image/jpeg');
								}
							},
							{
								label: 'SVG (TBD)'
							}
						]
					}
				};
			} else if (type === 'graph-node' && nodeId) {
				return {
					copy: {
						label: t('context_menu_copy'),
						onClick: () => {
							copyAction([nodeId], []);
						}
					},
					paste: {
						label: t('context_menu_paste'),
						onClick: () => {
							pasteAction(nodeId, true);
						}
					},
					delete: {
						label: t('context_menu_delete'),
						onClick: () => {
							deleteNodesAction([nodeId]);
						}
					},
					hide: {
						label: t('context_menu_hide'),
						onClick: () => {
							hideNodesAction([nodeId]);
						}
					},
					expand: {
						label: t('context_menu_expand'),
						onClick: () => {
							expandNodeAction(nodeId);
						},
						shouldRender: () => {
							return !get().isNodeExpanded(nodeId);
						}
					},
					collapse: {
						label: t('context_menu_collapse'),
						onClick: () => {
							collapseNode(nodeId);
						},
						shouldRender: () => {
							return get().isNodeExpanded(nodeId);
						}
					},
					load_perspective: {
						label: t('context_menu_perspective_load'),
						onClick: () => {
							loadPerspectiveNodeAction(nodeId);
						}
					},
					add_relation: {
						label: t('context_menu_add_relation'),
						subMenuRenderer: (goBack) => (
							<AddRelationAction nodeId={nodeId} goBack={goBack} />
						)
					},
					apply_layout_to_following_nodes: {
						label: t('context_menu_apply_layout'),
						options: [
							{
								label: t('context_menu_apply_layout_horizontal'),
								onClick: () => {
									applyLayoutToFollowingNodesAction(nodeId, 'horizontal');
								}
							},
							{
								label: t('context_menu_apply_layout_vertical'),
								onClick: () => {
									applyLayoutToFollowingNodesAction(nodeId, 'vertical');
								}
							}
						]
					}
				};
			}

			return {};
		},
		open: (data) => {
			set({ ...data, isOpen: true });
		},
		close: () => {
			set({
				isOpen: false,
				type: '',
				nodeIds: [],
				relationIds: [],
				x: 0,
				y: 0,
				onClose: null
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
