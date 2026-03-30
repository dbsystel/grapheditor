import { DEFAULT_EDGE_CURVATURE } from '@sigma/edge-curve';
import seedrandom from 'seedrandom';
import { MouseCoords, SigmaEventPayload, SigmaNodeEventPayload } from 'sigma/types';
import { assignForceLayout } from 'src/components/network-graph/layouts/force';
import { assignForceAtlas2Layout } from 'src/components/network-graph/layouts/forceAtlas2';
import { assignNoverlapLayout } from 'src/components/network-graph/layouts/noverlap';
import { assignRandomLayout } from 'src/components/network-graph/layouts/random';
import { GraphEditorSigma } from 'src/components/network-graph/NetworkGraph.interfaces';
import { Cartesian2D } from 'src/models/graph';
import { Node, NodeId } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';
import { useSearchStore } from 'src/stores/search';
import { api } from 'src/utils/api/api';
import {
	GRAPH_DEFAULT_EDGE_COLOR,
	GRAPH_DEFAULT_EDGE_LABEL_BACKGROUND_COLOR,
	GRAPH_DEFAULT_EDGE_LABEL_COLOR,
	GRAPH_DEFAULT_EDGE_LABEL_PADDING,
	GRAPH_DEFAULT_EDGE_SCALE_FACTOR,
	GRAPH_DEFAULT_EDGE_SIZE,
	GRAPH_DEFAULT_NODE_BORDER_COLOR,
	GRAPH_DEFAULT_NODE_BORDER_WIDTH,
	GRAPH_DEFAULT_NODE_COLOR,
	GRAPH_DEFAULT_NODE_LABEL_COLOR,
	GRAPH_DEFAULT_NODE_SCALE_FACTOR,
	GRAPH_DEFAULT_NODE_SIZE,
	GRAPH_FIT_TO_VIEWPORT_MIN_ZOOM,
	GRAPH_LAYOUT_FORCE,
	GRAPH_LAYOUT_FORCE_ATLAS_2,
	GRAPH_LAYOUT_NOVERLAP,
	GRAPH_LAYOUT_RANDOM
} from 'src/utils/constants';
import { EventBusEvents } from 'src/utils/event-bus';
import { getNodeSemanticIdOrId } from 'src/utils/helpers/nodes';

// disabling and enabling camera didn't work ¯\_(ツ)_/¯
export const preventSigmaCameraMovement = (event: MouseCoords) => {
	event.preventSigmaDefault();
	event.original.preventDefault();
	event.original.stopPropagation();
};

/**
 * Format style caption to display it on graph.

 In our style rules line breaks are encoded with 4 spaces or more. Ideally we
 would replace the caption by something that our graph library interprets
 as line break. Unfortunately \n doesn't really work for now, but at least
 we get rid of the spaces.
 TODO: fix line break
 */
export const formatCaption = (caption: string): string => {
	return caption.replace(/ {4,}/, '\n');
};

export const calculateNodeGraphSize = (nodeSize?: number) => {
	return (
		(nodeSize ? nodeSize : GRAPH_DEFAULT_NODE_SIZE) *
		GRAPH_DEFAULT_NODE_SCALE_FACTOR *
		useGraphStore.getState().getNodeSizeFactor()
	);
};

export const convertNodeGraphSizeToStyleSize = (nodeSize: number) => {
	return nodeSize / GRAPH_DEFAULT_NODE_SCALE_FACTOR;
};

export const getRelationColor = (relation: Relation) => {
	return relation.style['color'] || GRAPH_DEFAULT_EDGE_COLOR;
};

export const getNodeGraphData = (node: Node) => {
	const style = node.style;
	const x = parseFloat(style['x']) || seedrandom(node.id + 'x')();
	const y = parseFloat(style['y']) || seedrandom(node.id + 'y')();
	const color = style['color'] || GRAPH_DEFAULT_NODE_COLOR;
	const nodeSize = calculateNodeGraphSize(parseFloat(style['diameter']));
	const label = formatCaption(style['caption'] || node.title);
	const labelColor = style['text-color-internal'] || GRAPH_DEFAULT_NODE_LABEL_COLOR;
	const borderColor = style['border-color'] || GRAPH_DEFAULT_NODE_BORDER_COLOR;
	// borderSize is relative to node size
	const borderSize =
		(parseFloat(style['border-width']) || GRAPH_DEFAULT_NODE_BORDER_WIDTH) / nodeSize;

	return {
		x: x,
		y: y,
		color: color,
		size: nodeSize,
		label: label,
		labelColor: labelColor,
		borderColor: borderColor,
		borderSize: borderSize
	};
};

export const getRelationGraphData = (relation: Relation) => {
	const style = relation.style;
	const color = getRelationColor(relation);
	const size =
		(parseFloat(style['shaft-width']) || GRAPH_DEFAULT_EDGE_SIZE) *
		GRAPH_DEFAULT_EDGE_SCALE_FACTOR;
	const labelColor = style['text-color-internal'] || GRAPH_DEFAULT_EDGE_LABEL_COLOR;
	const labelBackgroundColor =
		style['text-color-external'] || GRAPH_DEFAULT_EDGE_LABEL_BACKGROUND_COLOR;
	const labelPadding = parseFloat(style['padding']) || GRAPH_DEFAULT_EDGE_LABEL_PADDING;
	const caption = formatCaption(style['caption'] || relation.title);

	return {
		color: color,
		size: size,
		label: caption,
		labelColor: labelColor,
		labelPadding: labelPadding,
		labelBackgroundColor: labelBackgroundColor
	};
};

export const fitGraphToViewport = (sigma: GraphEditorSigma, nodeIds: Array<string>) => {
	const camera = sigma.getCamera();
	const newCameraState = getCameraStateToFitViewportToNodes(sigma, nodeIds);
	const cameraStateChanged = !camera.hasState(newCameraState);

	newCameraState.ratio = Math.max(newCameraState.ratio, GRAPH_FIT_TO_VIEWPORT_MIN_ZOOM);

	camera.setState(newCameraState);

	return {
		cameraStateChanged: cameraStateChanged
	};
};

/**
 * Modified version of Sigma's "getCameraStateToFitViewportToNodes" function.
 * The original version would sometimes clip off nodes at the edges.
 */
export const getCameraStateToFitViewportToNodes = (
	sigma: GraphEditorSigma,
	nodes: Array<string>
) => {
	if (!nodes.length)
		throw new Error('getCameraStateToFitViewportToNodes: There should be at least one node.');

	let groupMinX = Infinity;
	let groupMaxX = -Infinity;
	let groupMinY = Infinity;
	let groupMaxY = -Infinity;
	let groupFramedMinX = Infinity;
	let groupFramedMaxX = -Infinity;
	let groupFramedMinY = Infinity;
	let groupFramedMaxY = -Infinity;

	const graph = sigma.getGraph();
	nodes.forEach((node) => {
		const data = sigma.getNodeDisplayData(node);
		if (!data)
			throw new Error(
				`getCameraStateToFitViewportToNodes: Node ${node} not found in sigma's graph.`
			);

		const { x, y, size } = graph.getNodeAttributes(node);
		const { x: framedX, y: framedY } = data;

		// we added node size into group boundaries calculation
		groupMinX = Math.min(groupMinX, x - size);
		groupMaxX = Math.max(groupMaxX, x + size);
		groupMinY = Math.min(groupMinY, y - size);
		groupMaxY = Math.max(groupMaxY, y + size);
		groupFramedMinX = Math.min(groupFramedMinX, framedX);
		groupFramedMaxX = Math.max(groupFramedMaxX, framedX);
		groupFramedMinY = Math.min(groupFramedMinY, framedY);
		groupFramedMaxY = Math.max(groupFramedMaxY, framedY);
	});

	const { x, y } = sigma.getCustomBBox() || sigma.getBBox();
	const graphWidth = x[1] - x[0];
	const graphHeight = y[1] - y[0];
	const groupCenterX = (groupMinX + groupMaxX) / 2;
	const groupCenterY = (groupMinY + groupMaxY) / 2;

	// fix for nodes being clipped of when using "groupCenterX" and "groupCenterY" only
	const cameraCenter = sigma.viewportToFramedGraph(
		sigma.graphToViewport({ x: groupCenterX, y: groupCenterY })
	);

	const ratioX = (groupMinX - groupMaxX) / graphWidth;
	const ratioY = (groupMinY - groupMaxY) / graphHeight;
	const ratio = Math.max(Math.abs(ratioX), Math.abs(ratioY));
	const camera = sigma.getCamera();

	return {
		...camera.getState(),
		angle: 0,
		x: cameraCenter.x,
		y: cameraCenter.y,
		ratio: ratio
	};
};

export const hideGraphContainer = () => {
	useGraphStore.getState().sigma.getContainer().classList.add('network-graph__container--hide');
};

export const showGraphContainer = () => {
	useGraphStore
		.getState()
		.sigma.getContainer()
		.classList.remove('network-graph__container--hide');
};

const match = /(?<value>\d+\.?\d*)/;
export const replaceFontSizeInFont = (font: string, newFontSize: number) => {
	return font.replace(match, newFontSize.toString());
};

export const isPointInsideRectangle = (
	point: Cartesian2D,
	topLeft: Cartesian2D,
	bottomRight: Cartesian2D
) => {
	return (
		point.x >= topLeft.x &&
		point.x <= bottomRight.x &&
		point.y <= topLeft.y &&
		point.y >= bottomRight.y
	);
};

export const isPointOutsideRectangle = (
	point: Cartesian2D,
	topLeft: Cartesian2D,
	bottomRight: Cartesian2D
) => {
	return (
		point.x < topLeft.x ||
		point.x > bottomRight.x ||
		point.y > topLeft.y ||
		point.y < bottomRight.y
	);
};

const getIntersectSide = (angleInDegrees: number) => {
	if (angleInDegrees > 45 && angleInDegrees < 135) {
		return 'top';
	} else if (angleInDegrees >= 135 && angleInDegrees <= 225) {
		return 'left';
	} else if (angleInDegrees > 225 && angleInDegrees < 315) {
		return 'bottom';
	} else {
		return 'right';
	}
};

// calculate degrees between two points
export const calculateAngle = (pointA: Cartesian2D, pointB: Cartesian2D) => {
	// Calculate differences
	const deltaX = pointB.x - pointA.x;
	const deltaY = pointB.y - pointA.y;

	// calculate angle in radians
	const angleRadians = Math.atan2(deltaY, deltaX);

	// convert angle to degrees
	let angleDegrees = angleRadians * (180 / Math.PI);

	// make sure the angle is from 0 to 360, not from 180 to -180
	if (angleDegrees < 0) {
		angleDegrees += 360;
	}

	return angleDegrees;
};

export const calculateHypotenuse = (oppositeSideLength: number, angleDegrees: number) => {
	const angleRadians = angleDegrees * (Math.PI / 180);
	const side = getIntersectSide(angleDegrees);
	let trigonometryFunctionValue = 0;

	if (side === 'left' || side === 'right') {
		trigonometryFunctionValue = Math.cos(angleRadians);
	} else {
		trigonometryFunctionValue = Math.sin(angleRadians);
	}

	return Math.abs(oppositeSideLength / trigonometryFunctionValue);
};

export const movePoint = (point: Cartesian2D, hypotenuse: number, angleDegrees: number) => {
	const angleRadians = angleDegrees * (Math.PI / 180);
	const xNew = point.x + Math.cos(angleRadians) * hypotenuse;
	const yNew = point.y + Math.sin(angleRadians) * hypotenuse;

	return { x: xNew, y: yNew };
};

export const getNodesViewportCoordinates = (nodeIds: Array<NodeId>) => {
	const nodeRectangles: Record<
		NodeId,
		{ topLeft: Cartesian2D; bottomRight: Cartesian2D; center: Cartesian2D }
	> = {};
	const sigma = useGraphStore.getState().sigma;

	nodeIds.forEach((nodeId) => {
		const nodeDisplayData = sigma.getNodeDisplayData(nodeId);

		if (nodeDisplayData) {
			const nodeViewportCoordinates = sigma.framedGraphToViewport({
				x: nodeDisplayData.x,
				y: nodeDisplayData.y
			});
			const nodeSize = sigma.scaleSize(nodeDisplayData.size);

			nodeRectangles[nodeId] = {
				topLeft: {
					x: nodeViewportCoordinates.x - nodeSize,
					y: nodeViewportCoordinates.y - nodeSize
				},
				bottomRight: {
					x: nodeViewportCoordinates.x + nodeSize,
					y: nodeViewportCoordinates.y + nodeSize
				},
				center: {
					x: nodeViewportCoordinates.x,
					y: nodeViewportCoordinates.y
				}
			};
		}
	});

	return nodeRectangles;
};

export const getMouseViewportCoordinates = (event: SigmaEventPayload | SigmaNodeEventPayload) => {
	if (event.event.original instanceof MouseEvent) {
		return {
			x: event.event.original.clientX,
			y: event.event.original.clientY
		};
	} else {
		return {
			x: 0,
			y: 0
		};
	}
};

export const onNodesUpdate = (data: EventBusEvents['nodesUpdate']) => {
	const sigma = useGraphStore.getState().sigma;

	data.nodes.forEach((node) => {
		if (sigma.getGraph().hasNode(node.id)) {
			const nodeGraphData: Partial<ReturnType<typeof getNodeGraphData>> =
				getNodeGraphData(node);

			// node position is determined by the graph layout or due to user interaction (e.g. node drag)
			delete nodeGraphData.x;
			delete nodeGraphData.y;

			sigma.getGraph().mergeNodeAttributes(node.id, {
				...nodeGraphData,
				data: node
			});
		}
	});
};

export const onNodesRemove = (data: EventBusEvents['nodesRemove']) => {
	data.nodes.forEach((node) => {
		useGraphStore.getState().removeNode(node.id);
	});
};

export const onRelationsUpdate = (data: EventBusEvents['relationsUpdate']) => {
	const sigma = useGraphStore.getState().sigma;

	data.relations.forEach((relation) => {
		if (sigma.getGraph().hasEdge(relation.id)) {
			const relationGraphData = getRelationGraphData(relation);

			sigma.getGraph().mergeEdgeAttributes(relation.id, {
				...relationGraphData,
				data: relation
			});
		}
	});
};

export const onRelationsRemove = (data: EventBusEvents['relationsRemove']) => {
	data.relations.forEach((relation) => {
		useGraphStore.getState().removeRelation(relation.id);
	});
};

export const addNewGraphNode = (event: SigmaEventPayload, onSuccess?: () => void) => {
	const { defaultNodeLabels, sigma } = useGraphStore.getState();

	useGraphStore.getState().setIsLoading(true);

	const eventCoordinates = sigma.viewportToGraph(event.event);

	api.nodes.fetch
		.postNode({
			labels: defaultNodeLabels
				? defaultNodeLabels.map((label) => getNodeSemanticIdOrId(label))
				: [],
			properties: {}
		})
		.then((response) => {
			const updatedNode = {
				...response.data,
				style: {
					...response.data.style,
					x: eventCoordinates.x.toString(),
					y: eventCoordinates.y.toString()
				}
			};

			useItemsStore.getState().setNode(updatedNode);
			useGraphStore.getState().addNode(updatedNode);

			if (onSuccess) {
				onSuccess();
			}
		})
		.finally(() => {
			useGraphStore.getState().setIsLoading(false);
		});
};

export const applySelectedAlgorithm = () => {
	const algorithm = useSearchStore.getState().algorithm;
	const algorithmApplied = [
		GRAPH_LAYOUT_FORCE_ATLAS_2,
		GRAPH_LAYOUT_FORCE,
		GRAPH_LAYOUT_NOVERLAP,
		GRAPH_LAYOUT_RANDOM
	].includes(algorithm);

	if (algorithm === GRAPH_LAYOUT_FORCE_ATLAS_2) {
		assignForceAtlas2Layout();
	} else if (algorithm === GRAPH_LAYOUT_FORCE) {
		assignForceLayout();
	} else if (algorithm === GRAPH_LAYOUT_NOVERLAP) {
		assignNoverlapLayout();
	} else if (algorithm === GRAPH_LAYOUT_RANDOM) {
		assignRandomLayout();
	}

	return algorithmApplied;
};

export const indexAndRefreshGraph = () => {
	// prepare relation parallel edges indexation
	useGraphStore.getState().indexParallelRelations();
	// render curved relations (if necessary)
	useGraphStore.getState().adaptRelationsTypeAndCurvature();

	// this is currently the only way that re-renders sigma properly when
	// there is a layout or nodes/relations change (clearing/refreshing
	// /rendering sigma/sigma graph didn't work, not sure why)
	useGraphStore.getState().sigma.setCustomBBox(null);
	useGraphStore.getState().sigma.refresh({ skipIndexation: true });
};

export const calculateBoundingBoxCenterByCoordinates = (points: Array<Cartesian2D>) => {
	let minX = Infinity;
	let maxX = -Infinity;
	let minY = Infinity;
	let maxY = -Infinity;

	points.forEach((point) => {
		const x = point.x;
		const y = point.y;

		minX = Math.min(minX, x);
		maxX = Math.max(maxX, x);
		minY = Math.min(minY, y);
		maxY = Math.max(maxY, y);
	});

	if (minX === Infinity || maxX === -Infinity || minY === Infinity || maxY === -Infinity) {
		return {
			x: 0,
			y: 0
		};
	}

	return {
		x: (minX + maxX) / 2,
		y: (minY + maxY) / 2
	};
};

export const getCoordinatesPointRelativeToTargetPoint = (
	current: Cartesian2D,
	source: Cartesian2D,
	target: Cartesian2D
) => {
	return {
		x: target.x + (current.x - source.x),
		y: target.y + (current.y - source.y)
	};
};

export function clearCanvasContexts(canvases: Array<HTMLCanvasElement>) {
	canvases.forEach((canvasElement) => {
		const webGLContext =
			canvasElement.getContext('webgl') || canvasElement.getContext('experimental-webgl');
		const webGL2Context = canvasElement.getContext('webgl2');
		const twoDContext = canvasElement.getContext('2d');

		if (webGLContext && webGLContext instanceof WebGLRenderingContext) {
			webGLContext.getExtension('WEBGL_lose_context')?.loseContext();
		}
		if (webGL2Context) {
			webGL2Context.getExtension('WEBGL_lose_context')?.loseContext();
		}
		if (twoDContext) {
			twoDContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
		}
	});
}

export const getCurvature = (index: number, maxIndex: number): number => {
	if (maxIndex <= 0) throw new Error('Invalid maxIndex');
	if (index < 0) return -getCurvature(-index, maxIndex);
	const amplitude = 3.5;
	const maxCurvature = amplitude * (1 - Math.exp(-maxIndex / amplitude)) * DEFAULT_EDGE_CURVATURE;
	return (maxCurvature * index) / maxIndex;
};

/**
 * For self-loops, curvature=0 would produce a collapsed/invisible loop
 * (unlike curved edges where curvature=0 simply means a straight line).
 * Every self-loop needs a minimum curvature to be visible, and each
 * additional self-loop on the same node must be progressively larger.
 */
export const getSelfLoopCurvature = (index: number, minIndex: number = 0) => {
	const baseCurvature = DEFAULT_EDGE_CURVATURE;
	const step = DEFAULT_EDGE_CURVATURE * 0.75;
	// Convert the symmetric parallel index range (e.g. [-3,-2,-1,0,1,2,3])
	// into a sequential 1-based series (1,2,3,4,5,6,7) so that every
	// self-loop gets a unique curvature and none overlap.
	const sequentialIndex = index - minIndex + 1;
	return baseCurvature + sequentialIndex * step;
};

export const enableSigmaMouseCaptor = () => {
	useGraphStore.getState().sigma.getMouseCaptor().enabled = true;
};

export const disableSigmaMouseCaptor = () => {
	useGraphStore.getState().sigma.getMouseCaptor().enabled = false;
};
