import { StyleProperties } from 'src/models/general';
import { Node, NodeId, NonPseudoNode } from 'src/models/node';
import { Relation, RelationId } from 'src/models/relation';
import { isNode, isNonPseudoNode } from 'src/utils/helpers/nodes';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

type NodeStorage = Map<string, Node>;
type RelationsStorage = Map<string, Relation>;
/**
 * Global application storage containing nodes, relations and API for managing
 * the state. It should be used/seen as the main source of truth when it comes
 * to nodes and relations, meaning components should rely on data stored in this
 * store.
 * Additionally, it provides an callback system enabling to hook into specific
 * actions, such as executing a callback when a node/relation/item is added.
 * Please note that the items store event API is WIP and current state is just
 * an example (or even better - a preparation for the upcoming application
 * functionality changes).
 *
 * TODO consider replacing Promise.allSettled with Promise.all,
 *  or creating additional methods (e.g. getNodesAsyncSettled)
 */
type ItemsStore = {
	// get only locally available store item
	getStoreItem: (
		itemId: NodeId | RelationId
	) => ReturnType<NodeStorage['get']> | ReturnType<RelationsStorage['get']>;
	setItem: (item: Node | Relation, preventRerender?: boolean) => void;
	clearItems: (preventRerender?: boolean) => void;
	// nodes storage API
	nodes: NodeStorage;
	setNode: (node: Node, preventRerender?: boolean) => void;
	setNodes: (nodes: Array<Node>, preventRerender?: boolean) => void;
	clearNodes: (preventRerender?: boolean) => void;
	// get only locally available store node
	getStoreNode: (nodeId: NodeId) => ReturnType<NodeStorage['get']>;
	getStoreNodes: (nodeIds: Array<NodeId>) => Array<Node>;
	// return non-pseudo nodes
	getStoreNonPseudoNodes: () => Array<NonPseudoNode>;
	removeNode: (nodeId: NodeId, preventRerender?: boolean) => void;
	removeNodes: (nodeIds: Array<NodeId>, preventRerender?: boolean) => void;
	setNodePosition: (
		nodeId: NodeId,
		coordinates: { x: number; y: number; z?: number },
		preventRerender?: boolean
	) => void;
	// relations storage API
	relations: Map<RelationId, Relation>;
	setRelation: (relation: Relation, preventRerender?: boolean) => void;
	setRelations: (relations: Array<Relation>, preventRerender?: boolean) => void;
	clearRelations: (preventRerender?: boolean) => void;
	// get only locally available store relation
	getStoreRelation: (relationId: RelationId) => ReturnType<RelationsStorage['get']>;
	getStoreRelations: (relationIds: Array<RelationId>) => Array<Relation>;
	removeRelation: (relationId: RelationId, preventRerender?: boolean) => void;
	removeRelations: (relationIds: Array<RelationId>, preventRerender?: boolean) => void;
	// callbacks API (example, WIP)
	callbacks: {
		[T in ItemsStoreEventListenerType]: Array<(item: ItemsStoreEventCallbackItem<T>) => void>;
	};
	// TODO rename to "on" or "onCallback" or ... since instead of events we work with callbacks
	addEventListener: <T extends ItemsStoreEventListenerType>(
		eventType: T,
		callback: (item: ItemsStoreEventCallbackItem<T>) => void
	) => void;
	removeEventListener: <T extends ItemsStoreEventListenerType>(
		eventType: T,
		callback: (item: ItemsStoreEventCallbackItem<T>) => void
	) => void;
	executeCallbacks: <T extends ItemsStoreEventListenerType>(
		eventType: T,
		item: ItemsStoreEventCallbackItem<T>
	) => void;
	// rest
	refreshNodes: () => void;
	refreshRelations: () => void;
	refreshNodesAndRelations: () => void;
	reset: () => void;
	resetButExclude: (excludeKeys: Array<keyof InitialState>) => void;
};

type InitialState = Omit<
	ItemsStore,
	| 'getStoreItem'
	| 'setItem'
	| 'clearItems'
	| 'setNodes'
	| 'clearNodes'
	| 'getNode'
	| 'getStoreNode'
	| 'getStoreNodes'
	| 'getStoreNonPseudoNodes'
	| 'getNodeAsync'
	| 'getNodesAsync'
	| 'setNode'
	| 'removeNode'
	| 'removeNodes'
	| 'setNodePosition'
	| 'setRelations'
	| 'clearRelations'
	| 'getRelation'
	| 'getStoreRelation'
	| 'getStoreRelations'
	| 'setRelation'
	| 'removeRelation'
	| 'removeRelations'
	| 'addEventListener'
	| 'removeEventListener'
	| 'executeCallbacks'
	| 'refreshNodes'
	| 'refreshRelations'
	| 'refreshNodesAndRelations'
	| 'reset'
	| 'resetButExclude'
>;

const getInitialState: () => InitialState = () => {
	return {
		nodes: new Map(),
		relations: new Map(),
		callbacks: {
			onNodesAdd: [],
			onNodesUpdate: [],
			onNodesRemove: [],
			onRelationsAdd: [],
			onRelationsUpdate: [],
			onRelationsRemove: []
		}
	};
};

type ItemsStoreEventListenerType =
	| 'onNodesAdd'
	| 'onNodesRemove'
	| 'onNodesUpdate'
	| 'onRelationsAdd'
	| 'onRelationsRemove'
	| 'onRelationsUpdate';
type ItemsStoreEventCallbackItem<T> = T extends 'onNodesAdd' | 'onNodesUpdate' | 'onNodesRemove'
	? Array<Node>
	: T extends 'onRelationsAdd' | 'onRelationsUpdate' | 'onRelationsRemove'
		? Array<Relation>
		: never;

export const useItemsStore = create<ItemsStore>()(
	subscribeWithSelector((set, get) => ({
		...getInitialState(),
		addEventListener: (eventType, callback) => {
			set({
				callbacks: {
					...get().callbacks,
					[eventType]: [...get().callbacks[eventType], callback]
				}
			});
		},
		removeEventListener: (eventType, callback) => {
			set({
				callbacks: {
					...get().callbacks,
					[eventType]: get().callbacks[eventType].filter((existingCallback) => {
						return existingCallback !== callback;
					})
				}
			});
		},
		executeCallbacks: (eventType, item) => {
			get().callbacks[eventType].forEach((callback) => {
				callback(item);
			});
		},
		getStoreItem: (itemId) => {
			return get().nodes.get(itemId) || get().relations.get(itemId);
		},
		setItem: (item, preventRerender) => {
			if (isNode(item)) {
				get().setNode(item, preventRerender);
			} else {
				get().setRelation(item, preventRerender);
			}
		},
		clearItems: (preventRerender) => {
			get().clearNodes(true);
			get().clearRelations(true);

			if (!preventRerender) {
				set({
					nodes: new Map(get().nodes),
					relations: new Map(get().relations)
				});
			}
		},
		clearNodes: (preventRerender) => {
			get().nodes = new Map();

			if (!preventRerender) {
				set({
					nodes: new Map(get().nodes)
				});
			}
		},
		getStoreNode: (nodeId) => {
			return get().nodes.get(nodeId);
		},
		getStoreNodes: (nodeIds) => {
			return get()
				.nodes.values()
				.toArray()
				.filter((node) => {
					return nodeIds.includes(node.id);
				});
		},
		getStoreNonPseudoNodes: () => {
			return get()
				.nodes.values()
				.toArray()
				.filter((node) => {
					return isNonPseudoNode(node);
				});
		},
		setNode: (node, preventRerender) => {
			const nodeExists = get().nodes.has(node.id);
			const updatedNodeMap = get().nodes.set(node.id, node);

			if (!preventRerender) {
				set({
					nodes: new Map(updatedNodeMap)
				});
			}

			get().executeCallbacks(nodeExists ? 'onNodesUpdate' : 'onNodesAdd', [node]);
		},
		setNodes: (nodes, preventRerender) => {
			const newNodes: Array<Node> = [];
			const updatedNodes: Array<Node> = [];

			nodes.forEach((node) => {
				const nodeExists = get().nodes.has(node.id);

				if (nodeExists) {
					updatedNodes.push(node);
				} else {
					newNodes.push(node);
				}

				get().nodes.set(node.id, node);
			});

			if (!preventRerender) {
				set({ nodes: new Map(get().nodes) });
			}

			if (newNodes.length) {
				get().executeCallbacks('onNodesAdd', newNodes);
			}
			if (updatedNodes.length) {
				get().executeCallbacks('onNodesUpdate', updatedNodes);
			}
		},
		setNodePosition: (nodeId, coordinates, preventRerender) => {
			const node = get().getStoreNode(nodeId);

			if (node) {
				const newStyleObject: StyleProperties = {
					...node.style,
					x: coordinates.x.toString(),
					y: coordinates.y.toString()
				};

				if (coordinates.z !== undefined) {
					newStyleObject.z = coordinates.z.toString();
				}

				get().setNode(
					{
						...node,
						style: {
							...node.style,
							...newStyleObject
						}
					},
					preventRerender
				);
			}
		},
		removeNode: (nodeId, preventRerender) => {
			const node = get().nodes.get(nodeId);

			if (!node) {
				return;
			}

			get().nodes.delete(nodeId);

			// remove a single node and all its attached relations from the store
			// https://graphology.github.io/mutation.html#dropnode
			get().relations.forEach((relation) => {
				if (relation.source_id === nodeId || relation.target_id === nodeId) {
					get().removeRelation(relation.id, preventRerender);
				}
			});

			if (!preventRerender) {
				set({
					nodes: new Map(get().nodes),
					relations: new Map(get().relations)
				});
			}

			get().executeCallbacks('onNodesRemove', [node]);
		},
		removeNodes: (nodeIds, preventRerender) => {
			const deletedNodes: Array<Node> = [];

			nodeIds.forEach((nodeId) => {
				const node = get().nodes.get(nodeId);

				if (!node) {
					return;
				}

				deletedNodes.push(node);
				get().nodes.delete(nodeId);

				// remove a single node and all its attached relations from the store
				// https://graphology.github.io/mutation.html#dropnode
				get().relations.forEach((relation) => {
					if (relation.source_id === nodeId || relation.target_id === nodeId) {
						get().removeRelation(relation.id, true);
					}
				});
			});

			if (!preventRerender) {
				set({
					nodes: new Map(get().nodes),
					relations: new Map(get().relations)
				});
			}

			get().executeCallbacks('onNodesRemove', deletedNodes);
		},
		setRelation: (relation, preventRerender) => {
			const relationExists = get().relations.has(relation.id);
			const updatedRelationMap = get().relations.set(relation.id, relation);

			if (!preventRerender) {
				set({
					relations: new Map(updatedRelationMap)
				});
			}

			get().executeCallbacks(relationExists ? 'onRelationsUpdate' : 'onRelationsAdd', [
				relation
			]);
		},
		setRelations: (relations, preventRerender) => {
			const newRelations: Array<Relation> = [];
			const updatedRelations: Array<Relation> = [];

			relations.forEach((relation) => {
				const relationExists = get().relations.has(relation.id);

				if (relationExists) {
					updatedRelations.push(relation);
				} else {
					newRelations.push(relation);
				}

				get().relations.set(relation.id, relation);
			});

			if (!preventRerender) {
				set({ relations: new Map(get().relations) });
			}

			if (newRelations.length) {
				get().executeCallbacks('onRelationsAdd', newRelations);
			}
			if (updatedRelations.length) {
				get().executeCallbacks('onRelationsUpdate', updatedRelations);
			}
		},
		clearRelations: (preventRerender) => {
			get().relations = new Map();

			if (!preventRerender) {
				set({
					relations: new Map(get().relations)
				});
			}
		},
		getStoreRelation: (relationId) => {
			return get().relations.get(relationId);
		},
		getStoreRelations: (relationIds) => {
			return get()
				.relations.values()
				.toArray()
				.filter((relation) => {
					return relationIds.includes(relation.id);
				});
		},
		removeRelation: (relationId, preventRerender) => {
			const relation = get().relations.get(relationId);

			if (!relation) {
				return;
			}

			get().relations.delete(relationId);

			if (!preventRerender) {
				set({
					relations: new Map(get().relations)
				});
			}

			get().executeCallbacks('onRelationsRemove', [relation]);
		},
		removeRelations: (relationIds, preventRerender) => {
			const removedRelations: Array<Relation> = [];

			relationIds.forEach((relationId) => {
				const relation = get().relations.get(relationId);

				if (!relation) {
					return;
				}

				removedRelations.push(relation);
				get().relations.delete(relationId);
			});

			if (!preventRerender) {
				set({
					relations: new Map(get().relations)
				});
			}

			get().executeCallbacks('onRelationsRemove', removedRelations);
		},
		refreshNodes: () => {
			set({
				nodes: new Map(get().nodes)
			});
		},
		refreshRelations: () => {
			set({
				relations: new Map(get().relations)
			});
		},
		refreshNodesAndRelations: () => {
			set({
				nodes: new Map(get().nodes),
				relations: new Map(get().relations)
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
	}))
);

(window as any).useItemsStore = useItemsStore;
