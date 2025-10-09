import seedrandom from 'seedrandom';
import { MouseCoords, SigmaEventPayload, SigmaNodeEventPayload } from 'sigma/types';
import { GraphEditorSigma } from 'src/components/network-graph/NetworkGraph.interfaces';
import { Point } from 'src/models/graph';
import { Node, NodeId } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { useGraphStore } from 'src/stores/graph';
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
	GRAPH_FIT_TO_VIEWPORT_MIN_ZOOM
} from 'src/utils/constants';

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

export const isPointInsideRectangle = (point: Point, topLeft: Point, bottomRight: Point) => {
	return (
		point.x >= topLeft.x &&
		point.x <= bottomRight.x &&
		point.y <= topLeft.y &&
		point.y >= bottomRight.y
	);
};

export const isPointOutsideRectangle = (point: Point, topLeft: Point, bottomRight: Point) => {
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
export const calculateAngle = (pointA: Point, pointB: Point) => {
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

export const movePoint = (point: Point, hypotenuse: number, angleDegrees: number) => {
	const angleRadians = angleDegrees * (Math.PI / 180);
	const xNew = point.x + Math.cos(angleRadians) * hypotenuse;
	const yNew = point.y + Math.sin(angleRadians) * hypotenuse;

	return { x: xNew, y: yNew };
};

export const getNodesViewportCoordinates = (nodeIds: Array<NodeId>) => {
	const nodeRectangles: Record<NodeId, { topLeft: Point; bottomRight: Point; center: Point }> =
		{};
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

export const onNodesUpdate = (nodes: Array<Node>) => {
	const sigma = useGraphStore.getState().sigma;

	nodes.forEach((node) => {
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

export const onNodesRemove = (nodes: Array<Node>) => {
	nodes.forEach((node) => {
		useGraphStore.getState().removeNode(node.id);
	});
};

export const onRelationsUpdate = (relations: Array<Relation>) => {
	const sigma = useGraphStore.getState().sigma;

	relations.forEach((relation) => {
		if (sigma.getGraph().hasEdge(relation.id)) {
			const relationGraphData = getRelationGraphData(relation);

			sigma.getGraph().mergeEdgeAttributes(relation.id, {
				...relationGraphData,
				data: relation
			});
		}
	});
};

export const onRelationsRemove = (relations: Array<Relation>) => {
	relations.forEach((relation) => {
		useGraphStore.getState().removeRelation(relation.id);
	});
};
