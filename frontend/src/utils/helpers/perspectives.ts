import {
	GraphEditorSigmaNodeAttributes,
	GraphEditorSigmaRelationAttributes
} from 'src/components/network-graph/NetworkGraph.interfaces';
import { Node } from 'src/models/node';
import { NodePositions, Perspective } from 'src/models/perspective';
import { Relation, RelationId } from 'src/models/relation';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';
import { usePerspectiveStore } from 'src/stores/perspective';
import { useSearchStore } from 'src/stores/search';
import {
	GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVE,
	GRAPH_LAYOUT_PERSPECTIVE
} from 'src/utils/constants';
import { buildPerspectiveSearchResult } from 'src/utils/helpers/search';

export const preparePerspectiveDataAndRefreshNodesPosition = () => {
	const setNodePosition = useItemsStore.getState().setNodePosition;
	const graph = useGraphStore.getState().sigma.getGraph();
	const nodePositions: NodePositions = {};
	const visibleRelationIds: Array<RelationId> = [];

	graph.forEachNode((nodeId: string, attributes: GraphEditorSigmaNodeAttributes) => {
		// hidden nodes are excluded from perspectives
		if (attributes.hidden) return;

		nodePositions[nodeId] = {
			x: attributes.x,
			y: attributes.y,
			z: 0
		};

		/* Update node data in memory, instead of reloading the graph from server.
		 * Important for layout change. Note: here we update node.style in the ItemsStore, not GraphStore
		 */
		setNodePosition(nodeId, { x: attributes.x, y: attributes.y, z: attributes.z });
	});

	// hidden relations excluded from perspectives
	graph.forEachEdge((edgeId: string, attributes: GraphEditorSigmaRelationAttributes) => {
		if (attributes.hidden) return;

		visibleRelationIds.push(edgeId);
	});

	return {
		nodePositions: nodePositions,
		relationIds: visibleRelationIds
	};
};

export const processPerspective = (perspective: Perspective) => {
	const nodes: Map<string, Node> = new Map(Object.entries(perspective.nodes));
	const relations: Map<string, Relation> = new Map();

	const { setAlgorithm, setIsResultProcessed, setResult } = useSearchStore.getState();
	const { unHighlightNodes, unHighlightRelations } = useGraphStore.getState();
	const setPerspective = usePerspectiveStore.getState().setPerspective;

	// map relations properly since GET /api/v1/perspectives currently
	// returns an object which keys are short ID form, and not the long one
	Object.values(perspective.relations).forEach((relation) => {
		relations.set(relation.id, relation);
	});

	unHighlightNodes();
	unHighlightRelations();
	setPerspective(perspective);
	setAlgorithm(GRAPH_LAYOUT_PERSPECTIVE);
	setIsResultProcessed(false);
	setResult({
		data: buildPerspectiveSearchResult(nodes, relations),
		type: GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVE
	});
};
