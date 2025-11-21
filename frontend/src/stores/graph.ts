import { DEFAULT_EDGE_CURVATURE, indexParallelEdgesIndex } from '@sigma/edge-curve';
import { MultiDirectedGraph } from 'graphology';
import { Attributes } from 'graphology-types';
import Sigma from 'sigma';
import {
	getNodeGraphData,
	getRelationColor,
	getRelationGraphData
} from 'src/components/network-graph/helpers';
import {
	GraphEditorSigma,
	GraphEditorSigmaNodeAttributes,
	GraphEditorSigmaRelationAttributes
} from 'src/components/network-graph/NetworkGraph.interfaces';
import { Node, NodeId } from 'src/models/node';
import { Relation, RelationId } from 'src/models/relation';
import { GRAPH_DEFAULT_ZOOMING_RATIO, GRAPH_SELECTED_EDGE_COLOR } from 'src/utils/constants';
import { isNode } from 'src/utils/helpers/nodes';
import { isRelation } from 'src/utils/helpers/relations';
import { create } from 'zustand';

type GraphStore = {
	isLoading: boolean;
	// TODO maybe use a more abstract name?
	sigma: GraphEditorSigma;
	// TODO maybe use a more abstract name?
	setSigma: (sigma: GraphEditorSigma) => void;
	isGraphRendered: boolean;
	setIsGraphRendered: (isGraphRendered: boolean) => void;
	perspectiveId: string | null;
	perspectiveName: string | null;
	clearPerspective: () => void;
	setIsLoading: (isLoading: boolean) => void;
	setPerspectiveId: (perspectiveId: string | null) => void;
	setPerspectiveName: (name: string | null) => void;
	defaultRelationType: Node | null;
	setDefaultRelationType: (relationType: Node | null) => void;
	defaultNodeLabels: Array<Node> | null;
	setDefaultNodeLabels: (defaultLabels: Array<Node> | null) => void;
	highlightNode: (nodeId: NodeId) => void;
	unHighlightNode: (nodeId: NodeId) => void;
	unHighlightNodes: () => void;
	highlightRelation: (relationId: RelationId) => void;
	unHighlightRelation: (relationId: RelationId) => void;
	unHighlightRelations: () => void;
	highlightedNodeIds: Map<NodeId, NodeId>; // map instead of array due to simpler API
	highlightedRelationIds: Map<RelationId, RelationId>; // map instead of array due to simpler API
	isNodeHighlighted: (nodeId: NodeId) => boolean;
	isRelationHighlighted: (relationId: RelationId) => boolean;
	adaptRelationsTypeAndCurvature: () => void;
	adaptRelationTypeAndCurvature: (relationId: RelationId, attributes?: Attributes) => void;
	indexParallelRelations: () => void;
	addNode: (node: Node | { id: NodeId; attributes?: GraphEditorSigmaNodeAttributes }) => void;
	addNodes: (
		nodes: Array<Node | { id: NodeId; attributes?: GraphEditorSigmaNodeAttributes }>
	) => void;
	removeNode: (nodeId: NodeId) => void;
	setNodePosition: (nodeId: NodeId, coordinates: { x: number; y: number; z?: number }) => void;
	addRelation: (
		relation:
			| Relation
			| {
					id: RelationId;
					source_id: NodeId;
					target_id: NodeId;
					attributes: GraphEditorSigmaRelationAttributes;
			  }
	) => void;
	addRelations: (
		relations: Array<
			| Relation
			| {
					id: RelationId;
					source_id: NodeId;
					target_id: NodeId;
					attributes: GraphEditorSigmaRelationAttributes;
			  }
		>
	) => void;
	removeRelation: (relationId: RelationId) => void;
	zoomFactor: number;
	setZoomFactor: (zoomFactor: number) => void;
	zoomFactorMin: number;
	zoomFactorMax: number;
	zoomFactorIncrementBy: number;
	resetButExclude: (excludeKeys: Array<keyof InitialState>) => void;
	reset: () => void;
	nodeSizeFactor: number;
	getNodeSizeFactor: () => number;
	setNodeSizeFactor: (newNodeSizeFactor: number) => void;
	isRenderingCapabilitiesWarningShown: boolean;
	setIsRenderingCapabilitiesWarningShown: (isRenderingCapabilitiesWarningShown: boolean) => void;
};

type InitialState = Omit<
	GraphStore,
	| 'setSigma'
	| 'setIsGraphRendered'
	| 'clearPerspective'
	| 'setIsLoading'
	| 'setPerspectiveId'
	| 'setPerspectiveName'
	| 'setDefaultRelationType'
	| 'setDefaultNodeLabels'
	| 'highlightNode'
	| 'unHighlightNode'
	| 'unHighlightNodes'
	| 'highlightRelation'
	| 'unHighlightRelation'
	| 'unHighlightRelations'
	| 'isNodeHighlighted'
	| 'isRelationHighlighted'
	| 'adaptRelationsTypeAndCurvature'
	| 'adaptRelationTypeAndCurvature'
	| 'indexParallelRelations'
	| 'addNode'
	| 'addNodes'
	| 'removeNode'
	| 'setNodePosition'
	| 'addRelation'
	| 'addRelations'
	| 'removeRelation'
	| 'setZoomFactor'
	| 'resetButExclude'
	| 'reset'
	| 'getNodeSizeFactor'
	| 'setNodeSizeFactor'
	| 'setIsRenderingCapabilitiesWarningShown'
>;

const getInitialState: () => InitialState = () => {
	/**
	 * 	This simplifies TS GraphStore.sigma definition.
	 * 	Defining GraphStore.sigma as Sigma | null will force us to check if
	 * 	sigma is available every time we want to use it or base some conditions
	 * 	on its existence.
	 * 	Since we have a wrapper which will set correct sigma instance (and it
	 * 	won't render children until this is done), this is a safe way to achieve
	 * 	the intended goal.
	 */
	const fakeSigmaContainer = document.createElement('div');
	const initialFakeSigmaInstance = new Sigma<
		GraphEditorSigmaNodeAttributes,
		GraphEditorSigmaRelationAttributes
	>(new MultiDirectedGraph(), fakeSigmaContainer, {
		allowInvalidContainer: true
	});

	return {
		sigma: initialFakeSigmaInstance,
		isGraphRendered: false,
		isLoading: false,
		perspectiveId: null,
		perspectiveName: null,
		defaultNodeLabels: null,
		defaultRelationType: null,
		highlightedNodeIds: new Map(),
		highlightedRelationIds: new Map(),
		zoomFactorMin: 1.1,
		zoomFactorMax: 3,
		zoomFactorIncrementBy: 0.1,
		zoomFactor: GRAPH_DEFAULT_ZOOMING_RATIO,
		nodeSizeFactor: 1,
		isRenderingCapabilitiesWarningShown: false
	};
};

/**
 * Nodes and relations graph store.
 * It contains graph-related data and methods. You can also think of it as Sigma.js
 * and Graphology.js wrapper since it uses Sigma.js under the hood for some methods.
 * In general, if you need a graph method or property, first look here. If it is
 * not available here, you can access sigma/graph directly and do what you need to do.
 * If you need to extend some of sigma/graph functionality, feel free to add a property
 * or method to this store (e.g. the addNode method in this store is a little bit
 * different than in graph, therefore we created our own addNode method).
 *
 * TODO add other sigma/graphology methods here, check modules/plugins
 *  and move from direct sigma/graphology usage to this store
 */
export const useGraphStore = create<GraphStore>((set, get) => {
	return {
		...getInitialState(),
		setIsGraphRendered: (isGraphRendered) => {
			set({ isGraphRendered: isGraphRendered });
		},
		setIsLoading: (isLoading: boolean) => set({ isLoading: isLoading }),
		clearPerspective: () => set({ perspectiveId: null, perspectiveName: null }),
		setPerspectiveId: (perspectiveId) => {
			set({ perspectiveId: perspectiveId });
		},
		setPerspectiveName: (name) => set({ perspectiveName: name }),
		setDefaultNodeLabels: (nodeLabels: Array<Node> | null) =>
			set({ defaultNodeLabels: nodeLabels }),
		setDefaultRelationType: (relationType: Node | null) =>
			set({ defaultRelationType: relationType }),
		setSigma: (sigma) => set({ sigma: sigma }),
		unHighlightNode: (nodeId) => {
			const sigma = get().sigma;
			const graphNodeExists = sigma.getGraph().hasNode(nodeId);

			if (!graphNodeExists) {
				return;
			}

			const highlightedNodeIds = get().highlightedNodeIds;

			highlightedNodeIds.delete(nodeId);

			set({
				highlightedNodeIds: new Map(highlightedNodeIds)
			});

			sigma.getGraph().setNodeAttribute(nodeId, 'highlighted', false);
		},
		unHighlightNodes: () => {
			const highlightedNodes = get().highlightedNodeIds;

			highlightedNodes.forEach((nodeId) => {
				get().unHighlightNode(nodeId);
			});
		},
		highlightNode: (nodeId) => {
			const sigma = get().sigma;
			const graphNodeExists = sigma.getGraph().hasNode(nodeId);
			const nodeAlreadyHighlighted = get().highlightedNodeIds.has(nodeId);

			if (!graphNodeExists || nodeAlreadyHighlighted) {
				return;
			}

			sigma.getGraph().setNodeAttribute(nodeId, 'highlighted', true);
			set({ highlightedNodeIds: new Map(get().highlightedNodeIds.set(nodeId, nodeId)) });
		},
		highlightRelation: (relationId) => {
			const sigma = get().sigma;
			const graphRelationExists = sigma.getGraph().hasEdge(relationId);
			const relationAlreadyHighlighted = get().highlightedRelationIds.has(relationId);

			if (!graphRelationExists || relationAlreadyHighlighted) {
				return;
			}

			sigma.getGraph().setEdgeAttribute(relationId, 'highlighted', true);
			sigma.getGraph().setEdgeAttribute(relationId, 'color', GRAPH_SELECTED_EDGE_COLOR);
			set({
				highlightedRelationIds: new Map(
					get().highlightedRelationIds.set(relationId, relationId)
				)
			});
		},
		unHighlightRelation: (relationId) => {
			const sigma = get().sigma;
			const graphRelationExists = sigma.getGraph().hasEdge(relationId);

			if (!graphRelationExists) {
				return;
			}

			const relation = sigma.getGraph().getEdgeAttribute(relationId, 'data');
			const highlightedRelationIds = get().highlightedRelationIds;

			highlightedRelationIds.delete(relationId);

			set({
				highlightedRelationIds: new Map(highlightedRelationIds)
			});

			sigma.getGraph().setEdgeAttribute(relationId, 'highlighted', false);
			sigma.getGraph().setEdgeAttribute(relationId, 'color', getRelationColor(relation));
		},
		unHighlightRelations: () => {
			const highlightedRelationIds = get().highlightedRelationIds;

			highlightedRelationIds.forEach((relationId) => {
				get().unHighlightRelation(relationId);
			});
		},
		isNodeHighlighted: (nodeId) => {
			return !!get().highlightedNodeIds.get(nodeId);
		},
		isRelationHighlighted: (relationId) => {
			return !!get().highlightedRelationIds.get(relationId);
		},
		adaptRelationsTypeAndCurvature: () => {
			get()
				.sigma.getGraph()
				.forEachEdge((edge, attributes) => {
					get().adaptRelationTypeAndCurvature(edge, attributes);
				});
		},
		adaptRelationTypeAndCurvature: (relationId, attributes) => {
			function getCurvature(index: number, maxIndex: number): number {
				if (maxIndex <= 0) throw new Error('Invalid maxIndex');
				if (index < 0) return -getCurvature(-index, maxIndex);
				const amplitude = 3.5;
				const maxCurvature =
					amplitude * (1 - Math.exp(-maxIndex / amplitude)) * DEFAULT_EDGE_CURVATURE;
				return (maxCurvature * index) / maxIndex;
			}

			const graph = get().sigma.getGraph();
			const { parallelIndex, parallelMinIndex, parallelMaxIndex } =
				attributes || graph.getEdgeAttributes(relationId);

			if (typeof parallelMinIndex === 'number') {
				graph.mergeEdgeAttributes(relationId, {
					type: parallelIndex ? 'curved' : 'straight',
					curvature: getCurvature(parallelIndex, parallelMaxIndex)
				});
			} else if (typeof parallelIndex === 'number') {
				graph.mergeEdgeAttributes(relationId, {
					type: 'curved',
					curvature: getCurvature(parallelIndex, parallelMaxIndex)
				});
			} else {
				graph.setEdgeAttribute(relationId, 'type', 'straight');
			}
		},
		indexParallelRelations: () => {
			indexParallelEdgesIndex(get().sigma.getGraph(), {
				edgeIndexAttribute: 'parallelIndex',
				edgeMinIndexAttribute: 'parallelMinIndex',
				edgeMaxIndexAttribute: 'parallelMaxIndex'
			});
		},
		addNode: (node) => {
			const sigma = get().sigma;
			const graphNodeExists = sigma.getGraph().hasNode(node.id);

			if (graphNodeExists) {
				return;
			}

			if (isNode(node)) {
				const nodeAttributes = getNodeGraphData(node);

				sigma.getGraph().addNode(node.id, {
					...nodeAttributes,
					// store node data in Sigma's graph object
					data: node
				});
			} else {
				sigma.getGraph().addNode(node.id, node.attributes);
			}
		},
		// much bulk, very wow
		addNodes: (nodes) => {
			nodes.forEach((node) => {
				get().addNode(node);
			});
		},
		removeNode: (nodeId) => {
			get().unHighlightNode(nodeId);

			if (get().sigma.getGraph().hasNode(nodeId)) {
				get().sigma.getGraph().dropNode(nodeId);
			}
		},
		setNodePosition: (nodeId, coordinates) => {
			const graph = get().sigma.getGraph();
			const localCoordinates: Record<string, number> = {
				x: coordinates.x,
				y: coordinates.y
			};

			if (coordinates.z !== undefined) {
				localCoordinates.z = coordinates.z;
			}

			graph.mergeNodeAttributes(nodeId, coordinates);
		},
		addRelation: (relation) => {
			const sigma = get().sigma;
			const graphRelationExists = sigma.getGraph().hasEdge(relation.id);
			const sourceNodeExists = sigma.getGraph().hasNode(relation.source_id);
			const targetNodeExists = sigma.getGraph().hasNode(relation.target_id);

			if (graphRelationExists) {
				return;
			}

			if (!sourceNodeExists || !targetNodeExists) {
				return;
			}

			if (isRelation(relation)) {
				const relationAttributes = getRelationGraphData(relation);

				sigma
					.getGraph()
					.addDirectedEdgeWithKey(relation.id, relation.source_id, relation.target_id, {
						...relationAttributes,
						type: 'straight',
						// store relation data in Sigma's graph object
						data: relation
					});
			} else {
				sigma
					.getGraph()
					.addDirectedEdgeWithKey(
						relation.id,
						relation.source_id,
						relation.target_id,
						relation.attributes
					);
			}
		},
		// TODO refactor to more bulky
		// much bulk, very wow
		addRelations: (relations) => {
			relations.forEach((relation) => {
				get().addRelation(relation);
			});
		},
		removeRelation: (relationId) => {
			if (get().sigma.getGraph().hasEdge(relationId)) {
				get().sigma.getGraph().dropEdge(relationId);
			}
		},
		setZoomFactor: (zoomFactor) => {
			set({ zoomFactor: zoomFactor });

			get().sigma.updateSetting('zoomingRatio', () => zoomFactor);
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
		},
		getNodeSizeFactor: () => {
			return get().nodeSizeFactor;
		},
		setNodeSizeFactor: (newNodeSizeFactor) => {
			let fixedSizeFactor = parseFloat(newNodeSizeFactor.toFixed(2));

			if (fixedSizeFactor <= 0.1) {
				fixedSizeFactor = 0.1;
			}

			set({ nodeSizeFactor: fixedSizeFactor });
		},
		setIsRenderingCapabilitiesWarningShown: (isRenderingCapabilitiesWarningShown) => {
			set({ isRenderingCapabilitiesWarningShown: isRenderingCapabilitiesWarningShown });
		}
	};
});

(window as any).useGraphStore = useGraphStore;
