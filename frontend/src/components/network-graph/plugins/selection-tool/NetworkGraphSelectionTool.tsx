import './NetworkGraphSelectionTool.scss';
import { useEffect, useRef } from 'react';
import { MouseCoords } from 'sigma/types';
import {
	calculateAngle,
	calculateHypotenuse,
	isPointInsideRectangle,
	movePoint,
	preventSigmaCameraMovement
} from 'src/components/network-graph/helpers';
import { StateManager } from 'src/components/network-graph/state-manager';
import { useGraphStore } from 'src/stores/graph';
import { Rectangle } from 'src/utils/helpers/general';

const drawDataDefaultValues = {
	x: 0,
	y: 0,
	width: 0,
	height: 0,
	canvas2dContext: null,
	selectionElement: null
};

export const NetworkGraphSelectionTool = () => {
	const selectionElementRef = useRef<HTMLCanvasElement | null>(null);
	const { highlightNode, highlightRelation, sigma } = useGraphStore((store) => store);
	const drawDataRef = useRef<{
		x: number;
		y: number;
		width: number;
		height: number;
		canvas2dContext: CanvasRenderingContext2D | null;
		selectionElement: HTMLCanvasElement | null;
	}>(drawDataDefaultValues);

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

		StateManager.getInstance().on('MOUSE_UP', onMouseUp);
		StateManager.getInstance().on('NODE_SELECTION', {
			beforeCallback: nodeSelectionBeforeCallback,
			callback: nodeSelectionCallback
		});
		StateManager.getInstance().on('MOUSE_UP', refreshSelectionElementSize);

		return () => {
			StateManager.getInstance().off('MOUSE_UP', onMouseUp);
			StateManager.getInstance().off('NODE_SELECTION', nodeSelectionCallback);
			StateManager.getInstance().off('MOUSE_UP', refreshSelectionElementSize);
		};
	}, [selectionElementRef.current]);

	const nodeSelectionBeforeCallback = (event: MouseCoords) => {
		const selectionElement = getSelectionElement();
		const canvas2dContext = getCanvas2dContext();

		drawDataRef.current = {
			...drawDataRef.current,
			x: event.x,
			y: event.y,
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
		const { selectionElement, canvas2dContext, x, y } = drawDataRef.current;

		if (!selectionElement || !canvas2dContext) {
			return;
		}

		const width = event.x - x;
		const height = event.y - y;

		drawDataRef.current.width = width;
		drawDataRef.current.height = height;

		canvas2dContext.clearRect(0, 0, selectionElement.width, selectionElement.height);
		canvas2dContext.strokeRect(x, y, width, height);
		canvas2dContext.fillRect(x, y, width, height);

		preventSigmaCameraMovement(event);
	};

	const onMouseUp = () => {
		const { selectionElement, x, y, width, height } = drawDataRef.current;

		if (!selectionElement) {
			return;
		}

		selectionElement.style.visibility = 'hidden';

		selectElementsInsideRectangle(new Rectangle(x, y, width, height));

		document.body.classList.remove('network-graph--no-text-selection');

		drawDataRef.current = { ...drawDataDefaultValues };
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

	const selectElementsInsideRectangle = (rectangle: Rectangle) => {
		const topLeftGraphCoordinates = sigma.viewportToGraph({
			x: rectangle.x1,
			y: rectangle.y1
		});
		const bottomRightGraphCoordinates = sigma.viewportToGraph({
			x: rectangle.x2,
			y: rectangle.y2
		});

		const graph = sigma.getGraph();

		for (const node of graph.nodeEntries()) {
			if (
				isPointInsideRectangle(
					{ x: node.attributes.x, y: node.attributes.y },
					topLeftGraphCoordinates,
					bottomRightGraphCoordinates
				)
			) {
				highlightNode(node.node);
			}
		}

		// console.log('graph', graph);

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

			// console.log('sourceCoordinates', sourceCoordinates);
			// console.log('targetCoordinates', targetCoordinates);

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
			// console.log('sourceHypotenuse', sourceHypotenuse);
			// console.log('targetHypotenuse', targetHypotenuse);
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
			// console.log('newStartCoordinates', newStartCoordinates);
			// console.log('newEndCoordinates', newEndCoordinates);
			//
			// console.log(
			// 	'start inside',
			// 	isPointInsideRectangle(
			// 		newStartCoordinates,
			// 		topLeftGraphCoordinates,
			// 		bottomRightGraphCoordinates
			// 	)
			// );
			// console.log(
			// 	'end inside',
			// 	isPointInsideRectangle(
			// 		newEndCoordinates,
			// 		topLeftGraphCoordinates,
			// 		bottomRightGraphCoordinates
			// 	)
			// );

			// setTimeout(() => {
			// 	const id1 = window.crypto.randomUUID();
			// 	const id2 = window.crypto.randomUUID();
			//
			// 	sigma.getGraph().addNode(id1, {
			// 		//...sourceAttributes,
			// 		data: sourceAttributes.data,
			// 		x: newStartCoordinates.x,
			// 		y: newStartCoordinates.y,
			// 		size: 1,
			// 		color: '#000000'
			// 	});
			// 	sigma.getGraph().addNode(id2, {
			// 		//...targetAttributes,
			// 		data: targetAttributes.data,
			// 		x: newEndCoordinates.x,
			// 		y: newEndCoordinates.y,
			// 		size: 1,
			// 		color: '#000000'
			// 	});
			// 	const id3 = sigma.getGraph().addEdge(id1, id2, relation.attributes);
			//
			// 	setTimeout(() => {
			// 		sigma.getGraph().dropNode(id1);
			// 		sigma.getGraph().dropNode(id2);
			// 		//sigma.getGraph().dropEdge(id3);
			// 	}, 3000);
			// }, 100);

			if (
				isPointInsideRectangle(
					newStartCoordinates,
					topLeftGraphCoordinates,
					bottomRightGraphCoordinates
				) &&
				isPointInsideRectangle(
					newEndCoordinates,
					topLeftGraphCoordinates,
					bottomRightGraphCoordinates
				)
			) {
				highlightRelation(relation.edge);
			}

			// console.log('');
		}
	};

	return <canvas ref={selectionElementRef} className="network-graph__selection" />;
};
