import { useEffect, useRef } from 'react';
import { Coordinates, MouseCoords, SigmaNodeEventPayload } from 'sigma/types';
import {
	calculateNodeGraphSize,
	getRelationGraphData,
	preventSigmaCameraMovement
} from 'src/components/network-graph/helpers';
import { GraphEditorSigmaNodeAttributes } from 'src/components/network-graph/NetworkGraph.interfaces';
import { StateManager } from 'src/components/network-graph/state-manager';
import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';
import { nodesApi } from 'src/utils/api/nodes';
import { relationsApi } from 'src/utils/api/relations';
import { GraphEditorTypeSimplified } from 'src/utils/constants';
import { generateNode } from 'src/utils/helpers/nodes';
import { generateRelation } from 'src/utils/helpers/relations';
import { idFormatter } from 'src/utils/idFormatter';

const defaultData = {
	sourceNodeId: '',
	movingNodeId: '',
	relation: null,
	relationConnectionTargetNodeId: '',
	isModeActive: false
};

/**
 * This plugin enables quick graphical creation of new nodes which are auto-connected
 * to the starting node, or connecting already existing nodes.
 * If you connect two existing nodes, only the new relation will be stored on server.
 * Otherwise, a new node and a relation connecting to it will be store on server.
 * To engage this plugin, please hold down CTRL and left-mouse button on a node
 * and start moving your mouse.
 */
export const NetworkGraphAutoConnectNode = () => {
	const temporaryDataRef = useRef<{
		sourceNodeId: string;
		movingNodeId: string;
		relation: Relation | null;
		relationConnectionTargetNodeId: string;
		isModeActive: boolean;
	}>({ ...defaultData });
	const previousCoordinatesRef = useRef<Coordinates>({ x: 0, y: 0 });
	const {
		setIsLoading,
		defaultNodeLabels,
		defaultRelationType,
		highlightNode,
		unHighlightNodes,
		adaptRelationTypeAndCurvature,
		indexParallelRelations,
		addNode: addGraphNode,
		addRelation: addGraphRelation,
		removeRelation: removeGraphRelation,
		removeNode: removeGraphNode,
		sigma
	} = useGraphStore((state) => state);
	const setNode = useItemsStore((store) => store.setNode);
	const setRelation = useItemsStore((store) => store.setRelation);
	const removeRelation = useItemsStore((store) => store.removeRelation);

	useEffect(() => {
		StateManager.getInstance().on('NODE_DOWN', onNodeDown);
		StateManager.getInstance().on('NODE_AUTO_CONNECT', {
			beforeCallback: onAutoConnectNodeBefore,
			callback: onAutoConnectNode
		});
		StateManager.getInstance().on('MOUSE_UP', saveAutoConnectNodeData);

		return () => {
			StateManager.getInstance().off('NODE_DOWN', onNodeDown);
			StateManager.getInstance().off('NODE_AUTO_CONNECT', onAutoConnectNode);
			StateManager.getInstance().off('MOUSE_UP', saveAutoConnectNodeData);
		};
	}, [defaultNodeLabels, defaultRelationType]);

	const onNodeDown = (event: SigmaNodeEventPayload) => {
		temporaryDataRef.current.sourceNodeId = event.node;
	};

	const onAutoConnectNodeBefore = (event: MouseCoords) => {
		const { sourceNodeId } = temporaryDataRef.current;

		if (sourceNodeId) {
			const movingNodeId = window.crypto.randomUUID();
			const sigmaNodeAttributes = sigma.getGraph().getNodeAttributes(sourceNodeId);

			addGraphNode({
				id: movingNodeId,
				attributes: {
					x: sigmaNodeAttributes.x,
					y: sigmaNodeAttributes.y,
					size: calculateNodeGraphSize(50),
					label: null,
					// dummy node
					data: generateNode(movingNodeId)
				}
			});

			temporaryDataRef.current.movingNodeId = movingNodeId;
			temporaryDataRef.current.isModeActive = true;
			previousCoordinatesRef.current = sigma.viewportToGraph(event);

			createGraphRelation(sourceNodeId, movingNodeId);
			unHighlightNodes();
			highlightNode(movingNodeId);
		}
	};

	const onAutoConnectNode = (event: MouseCoords) => {
		const graph = sigma.getGraph();
		const previousPosition = previousCoordinatesRef.current;
		const currentPosition = sigma.viewportToGraph(event);
		const { sourceNodeId, relationConnectionTargetNodeId, relation, movingNodeId } =
			temporaryDataRef.current;
		let overlappingNodeId: string | undefined = '';

		// update moving node position
		graph.updateNodeAttribute(movingNodeId, 'x', (currentX) => {
			return (currentX || 0) + (currentPosition.x - previousPosition.x);
		});
		graph.updateNodeAttribute(movingNodeId, 'y', (currentY) => {
			return (currentY || 0) + (currentPosition.y - previousPosition.y);
		});

		const sigmaNode = graph.getNodeAttributes(movingNodeId);

		// check for overlapping node
		overlappingNodeId = graph.nodes().find((nodeId) => {
			if (nodeId === movingNodeId) {
				return false;
			}

			const attrs = graph.getNodeAttributes(nodeId);

			return areSquareNodesOverlapping(sigmaNode, attrs);
		});

		if (overlappingNodeId !== sourceNodeId && relation) {
			// if no connection to a non-moving node is done and overlapping a (non-source) node
			if (overlappingNodeId && relationConnectionTargetNodeId !== overlappingNodeId) {
				temporaryDataRef.current.relationConnectionTargetNodeId = overlappingNodeId;

				hideTemporaryNode();
				localRemoveGraphRelation(relation.id);
				createGraphRelation(sourceNodeId, overlappingNodeId);
			}
			// if connection to a non-moving node is done and leaving the overlapping (non-source) node
			else if (relationConnectionTargetNodeId && !overlappingNodeId) {
				temporaryDataRef.current.relationConnectionTargetNodeId = '';

				showTemporaryNode();
				localRemoveGraphRelation(relation.id);
				createGraphRelation(sourceNodeId, movingNodeId);
			}
		}

		previousCoordinatesRef.current = currentPosition;

		preventSigmaCameraMovement(event);
	};

	const areSquareNodesOverlapping = (
		node1Attributes: GraphEditorSigmaNodeAttributes,
		node2Attributes: GraphEditorSigmaNodeAttributes
	) => {
		// Calculate the top-left and bottom-right corners based on the center and size
		const square1Left = node1Attributes.x - node1Attributes.size;
		const square1Right = node1Attributes.x + node1Attributes.size;
		const square1Top = node1Attributes.y - node1Attributes.size;
		const square1Bottom = node1Attributes.y + node1Attributes.size;

		const square2Left = node2Attributes.x - node2Attributes.size;
		const square2Right = node2Attributes.x + node2Attributes.size;
		const square2Top = node2Attributes.y - node2Attributes.size;
		const square2Bottom = node2Attributes.y + node2Attributes.size;

		// Check if one square is to the left or right of the other
		if (square1Left >= square2Right || square2Left >= square1Right) {
			return false;
		}

		// Check if one square is above or below the other
		if (square1Top >= square2Bottom || square2Top >= square1Bottom) {
			return false;
		}

		// Otherwise, they are overlapping
		return true;
	};

	const createGraphRelation = (sourceId: string, targetId: string) => {
		const relation = generateRelation(
			idFormatter.formatSemanticId(
				GraphEditorTypeSimplified.META_RELATION,
				window.crypto.randomUUID()
			),
			sourceId,
			targetId,
			{
				'shaft-width': '5px'
			}
		);
		temporaryDataRef.current.relation = relation;

		const relationGraphData = getRelationGraphData(relation);

		addGraphRelation({
			id: relation.id,
			source_id: relation.source_id,
			target_id: relation.target_id,
			attributes: {
				size: relationGraphData.size,
				label: null,
				color: relationGraphData.color,
				// store relation data in Sigma's graph object
				data: relation
			}
		});

		indexParallelRelations();
		adaptRelationTypeAndCurvature(relation.id);
	};

	const localRemoveGraphRelation = (relationId: string) => {
		removeGraphRelation(relationId);
		temporaryDataRef.current.relation = null;
	};

	const hideTemporaryNode = () => {
		const movingNodeId = temporaryDataRef.current.movingNodeId;

		if (movingNodeId) {
			sigma.getGraph().setNodeAttribute(movingNodeId, 'hidden', true);
		}
	};

	const showTemporaryNode = () => {
		const movingNodeId = temporaryDataRef.current.movingNodeId;

		if (movingNodeId) {
			sigma.getGraph().setNodeAttribute(movingNodeId, 'hidden', false);
		}
	};

	const saveAutoConnectNodeData = async () => {
		const { relation, relationConnectionTargetNodeId, movingNodeId, isModeActive } =
			temporaryDataRef.current;

		// no auto-connect-node logic executed or no relation or end node is our starting node
		if (!isModeActive || !relation) {
			return;
		}

		setIsLoading(true);

		let targetNodeId = relation.target_id;
		let newNode: Node | null = null;
		let newRelationFromServer: Relation | null = null;
		const newRelationType = defaultRelationType ? defaultRelationType.id : relation.type;

		// if connected to the moving node
		if (!relationConnectionTargetNodeId) {
			const defaultNodeLabelIds = defaultNodeLabels
				? defaultNodeLabels.map((label) => label.id)
				: [];
			// store new node on server
			const newNodeResponse = await nodesApi.postNode({
				labels: defaultNodeLabelIds,
				properties: {}
			});

			// use the new node id from server when creating a relation
			targetNodeId = newNodeResponse.data.id;

			newNode = {
				...newNodeResponse.data,
				style: {
					...newNodeResponse.data.style,
					x: sigma.getGraph().getNodeAttribute(movingNodeId, 'x'),
					y: sigma.getGraph().getNodeAttribute(movingNodeId, 'y')
				}
			};
		}

		// store new relation on server
		const newRelationResponse = await relationsApi.postRelation({
			properties: {},
			sourceId: relation.source_id,
			targetId: targetNodeId,
			type: newRelationType
		});

		newRelationFromServer = newRelationResponse.data;

		setIsLoading(false);
		temporaryDataRef.current = { ...defaultData };

		// sync graph with node from server
		if (newNode) {
			setNode(newNode, true);
			addGraphNode(newNode);

			// After creating a node in the graph, Sigma won't register we are
			// hovering the newly created node.That's why click on that node
			// without moving your mouse won't work.
			// There are some solutions (leaving for possible later use):
			// #1
			// (sigma as any).hoveredNode = newNodeFromServer.node.id;
			// highlightNode(sigma, newNodeFromServer.node.id);
			// #2
			// sigma.refresh();
			// sigma.getMouseCaptor().emit('mousemove', event);
			// #3
			// sigma.refresh();
			// (sigma as any).activeListeners.handleMove(event);
		}

		// sync graph with relation from server
		if (newRelationFromServer) {
			setRelation(newRelationFromServer, true);
			addGraphRelation(newRelationFromServer);
		}

		sigma.refresh();

		removeRelation(relation.id, true);
		removeGraphRelation(relation.id);
		removeGraphNode(movingNodeId);

		// index only (temporary) relation has been removed
		if (newRelationFromServer) {
			indexParallelRelations();
			adaptRelationTypeAndCurvature(newRelationFromServer.id);
		}
	};

	return null;
};
