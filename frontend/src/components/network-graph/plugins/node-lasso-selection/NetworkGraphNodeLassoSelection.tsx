import './NetworkGraphNodeLassoSelection.scss';
import { useEffect, useRef } from 'react';
import { MouseCoords } from 'sigma/types';
import {
	calculateAngle,
	calculateHypotenuse,
	isPointInsidePolygon,
	isSegmentInsidePolygon,
	movePoint,
	preventSigmaCameraMovement
} from 'src/components/network-graph/helpers';
import { StateManager } from 'src/components/network-graph/state-manager';
import { Cartesian2D } from 'src/models/graph';
import { useGraphStore } from 'src/stores/graph';

type DrawData = {
	points: Array<Cartesian2D>;
	canvas2dContext: CanvasRenderingContext2D | null;
	selectionElement: HTMLCanvasElement | null;
};

const MINIMUM_POINT_DISTANCE = 2;

const getDrawDataDefaultValues = (): DrawData => ({
	points: [],
	canvas2dContext: null,
	selectionElement: null
});

export const NetworkGraphNodeLassoSelection = () => {
	const selectionElementRef = useRef<HTMLCanvasElement | null>(null);
	const { highlightNode, highlightRelation, sigma } = useGraphStore((store) => store);
	const drawDataRef = useRef<DrawData>(getDrawDataDefaultValues());

	useEffect(() => {
		const selectionElement = getSelectionElement();
		const ctx = getCanvas2dContext();

		if (!selectionElement || !ctx) {
			return;
		}

		// position the selection element above all but the mouse canvas
		sigma
			.getMouseCaptor()
			.container.parentElement?.insertBefore(
				selectionElement,
				sigma.getMouseCaptor().container
			);

		refreshSelectionElementSize();

		const stateManager = StateManager.getInstance();
		const unsubscribeMouseUp = stateManager.subscribe('mouseUp', onMouseUp);
		const unsubscribeLassoSelection = stateManager.subscribe('nodeLassoSelection', {
			beforeCallback: nodeSelectionBeforeCallback,
			callback: nodeSelectionCallback
		});
		const unsubscribeResize = stateManager.subscribe('resize', refreshSelectionElementSize);

		return () => {
			unsubscribeMouseUp();
			unsubscribeLassoSelection();
			unsubscribeResize();
			selectionElement.style.visibility = 'hidden';
			document.body.classList.remove('network-graph--no-text-selection');
			drawDataRef.current = getDrawDataDefaultValues();
		};
	}, [sigma]);

	const nodeSelectionBeforeCallback = (event: MouseCoords) => {
		const selectionElement = getSelectionElement();
		const canvas2dContext = getCanvas2dContext();

		drawDataRef.current = {
			points: [{ x: event.x, y: event.y }],
			selectionElement: selectionElement,
			canvas2dContext: canvas2dContext
		};

		document.body.classList.add('network-graph--no-text-selection');

		if (selectionElement && canvas2dContext) {
			selectionElement.style.visibility = 'visible';

			canvas2dContext.clearRect(0, 0, selectionElement.width, selectionElement.height);
		}
	};

	const nodeSelectionCallback = (event: MouseCoords) => {
		const { selectionElement, canvas2dContext } = drawDataRef.current;

		if (!selectionElement || !canvas2dContext) {
			return;
		}

		addLassoPoint(event);
		drawLasso();

		preventSigmaCameraMovement(event);
	};

	const onMouseUp = (event: MouseCoords) => {
		const { selectionElement } = drawDataRef.current;

		if (!selectionElement) {
			return;
		}

		addLassoPoint(event);
		selectionElement.style.visibility = 'hidden';

		selectElementsInsideLasso(drawDataRef.current.points);

		document.body.classList.remove('network-graph--no-text-selection');

		drawDataRef.current = getDrawDataDefaultValues();
	};

	const addLassoPoint = (event: MouseCoords) => {
		const points = drawDataRef.current.points;
		const previousPoint = points[points.length - 1];

		if (
			!previousPoint ||
			Math.hypot(event.x - previousPoint.x, event.y - previousPoint.y) >=
				MINIMUM_POINT_DISTANCE
		) {
			points.push({ x: event.x, y: event.y });
		}
	};

	const drawLasso = () => {
		const { selectionElement, canvas2dContext, points } = drawDataRef.current;

		if (!selectionElement || !canvas2dContext || points.length === 0) {
			return;
		}

		canvas2dContext.clearRect(0, 0, selectionElement.width, selectionElement.height);
		canvas2dContext.beginPath();
		canvas2dContext.moveTo(points[0].x, points[0].y);

		for (const point of points.slice(1)) {
			canvas2dContext.lineTo(point.x, point.y);
		}

		if (points.length > 2) {
			canvas2dContext.closePath();
			canvas2dContext.fill('evenodd');
		}

		canvas2dContext.stroke();
	};

	const getSelectionElement = () => {
		return selectionElementRef.current;
	};

	const getCanvas2dContext = () => {
		const selectionElement = getSelectionElement();

		if (!selectionElement) {
			return null;
		}

		return selectionElement.getContext('2d');
	};

	function refreshSelectionElementSize() {
		const selectionElement = getSelectionElement();
		const ctx = getCanvas2dContext();
		const dimensions = sigma.getDimensions();

		if (selectionElement && ctx) {
			// prevent blurry canvas elements
			// @see https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas#scaling_for_high_resolution_displays
			const scale = window.devicePixelRatio;

			selectionElement.style.width = dimensions.width + 'px';
			selectionElement.style.height = dimensions.height + 'px';

			selectionElement.width = Math.floor(dimensions.width * scale);
			selectionElement.height = Math.floor(dimensions.height * scale);

			ctx.scale(scale, scale);

			// style the selection element
			ctx.strokeStyle = 'rgb(124,174,230)';
			ctx.fillStyle = 'rgba(124,174,230, 0.15)';
			ctx.lineWidth = 1;
		}
	}

	const selectElementsInsideLasso = (lassoPoints: Array<Cartesian2D>) => {
		const graphLassoPoints = lassoPoints.map((point) => sigma.viewportToGraph(point));

		const graph = sigma.getGraph();

		for (const node of graph.nodeEntries()) {
			if (
				isPointInsidePolygon(
					{ x: node.attributes.x, y: node.attributes.y },
					graphLassoPoints
				)
			) {
				highlightNode(node.node);
			}
		}

		for (const relation of graph.edgeEntries()) {
			const { sourceAttributes, targetAttributes } = relation;
			const sourceCoordinates = {
				x: sourceAttributes.x,
				y: sourceAttributes.y
			};
			const targetCoordinates = {
				x: targetAttributes.x,
				y: targetAttributes.y
			};

			const angleFromStartToEnd = calculateAngle(sourceCoordinates, targetCoordinates);
			const angleFromEndToStart = calculateAngle(targetCoordinates, sourceCoordinates);
			const sourceHypotenuse = calculateHypotenuse(
				sourceAttributes.size,
				angleFromStartToEnd
			);
			const targetHypotenuse = calculateHypotenuse(
				targetAttributes.size,
				angleFromEndToStart
			);

			const newStartCoordinates = movePoint(
				sourceCoordinates,
				sourceHypotenuse,
				angleFromStartToEnd
			);
			const newEndCoordinates = movePoint(
				targetCoordinates,
				targetHypotenuse,
				angleFromEndToStart
			);

			if (isSegmentInsidePolygon(newStartCoordinates, newEndCoordinates, graphLassoPoints)) {
				highlightRelation(relation.edge);
			}
		}
	};

	return <canvas ref={selectionElementRef} className="network-graph__lasso-selection" />;
};
