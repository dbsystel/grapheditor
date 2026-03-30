import { StyleProperties } from 'src/models/general';
import { Node, NodeId, NonPseudoNode } from 'src/models/node';
import { Relation, RelationId } from 'src/models/relation';
import { eventBus } from 'src/utils/event-bus';
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
	setNodePosition: (nodeId: NodeId, coordinates: { x: number; y: number; z?: number }) => void;
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
	| 'refreshNodes'
	| 'refreshRelations'
	| 'refreshNodesAndRelations'
	| 'reset'
	| 'resetButExclude'
>;

const getInitialState: () => InitialState = () => {
	return {
		nodes: new Map(),
		relations: new Map()
	};
};

export const useItemsStore = create<ItemsStore>()(
	subscribeWithSelector((set, get) => ({
		...getInitialState(),
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

			eventBus.publish(nodeExists ? 'nodesUpdate' : 'nodesAdd', { nodes: [node] });
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
				eventBus.publish('nodesAdd', { nodes: newNodes });
			}
			if (updatedNodes.length) {
				eventBus.publish('nodesUpdate', { nodes: updatedNodes });
			}
		},
		setNodePosition: (nodeId, coordinates) => {
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

				// style changes must trigger separate event (not yet implemented) since style changes
				// are mostly GUI changes, so we don't want to trigger full node update event which
				// might trigger some API calls etc.
				node.style = {
					...node.style,
					...newStyleObject
				};
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

			eventBus.publish('nodesRemove', { nodes: [node] });
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

			eventBus.publish('nodesRemove', { nodes: deletedNodes });
		},
		setRelation: (relation, preventRerender) => {
			const relationExists = get().relations.has(relation.id);
			const updatedRelationMap = get().relations.set(relation.id, relation);

			if (!preventRerender) {
				set({
					relations: new Map(updatedRelationMap)
				});
			}

			eventBus.publish(relationExists ? 'relationsUpdate' : 'relationsAdd', {
				relations: [relation]
			});
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
				eventBus.publish('relationsAdd', { relations: newRelations });
			}
			if (updatedRelations.length) {
				eventBus.publish('relationsUpdate', { relations: updatedRelations });
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

			eventBus.publish('relationsRemove', { relations: [relation] });
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

			eventBus.publish('relationsRemove', { relations: removedRelations });
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
