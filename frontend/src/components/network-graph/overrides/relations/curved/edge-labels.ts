import { CreateEdgeCurveProgramOptions } from '@sigma/edge-curve';
import { Attributes } from 'graphology-types';
import { Settings } from 'sigma/settings';
import { EdgeDisplayData, NodeDisplayData, PartialButFor } from 'sigma/types';
import { useGraphStore } from 'src/stores/graph';

interface Point {
	x: number;
	y: number;
}

type EdgeLabelDrawingFunction<
	N extends Attributes = Attributes,
	E extends Attributes = Attributes,
	G extends Attributes = Attributes
> = (
	context: CanvasRenderingContext2D,
	edgeData: PartialButFor<
		EdgeDisplayData & {
			labelColor?: string;
			labelPadding?: number;
			labelBackgroundColor?: string;
		},
		'label' | 'labelColor' | 'labelBackgroundColor' | 'color' | 'size' | 'labelPadding'
	>,
	sourceData: PartialButFor<NodeDisplayData, 'x' | 'y' | 'size'>,
	targetData: PartialButFor<NodeDisplayData, 'x' | 'y' | 'size'>,
	settings: Settings<N, E, G>
) => void;

function getCurvePoint(t: number, p0: Point, p1: Point, p2: Point): Point {
	const x = (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t ** 2 * p2.x;
	const y = (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t ** 2 * p2.y;
	return { x, y };
}

function getCurveLength(p0: Point, p1: Point, p2: Point): number {
	const steps = 20;
	let length = 0;
	let lastPoint = p0;
	for (let i = 0; i < steps; i++) {
		const point = getCurvePoint((i + 1) / steps, p0, p1, p2);
		length += Math.sqrt((lastPoint.x - point.x) ** 2 + (lastPoint.y - point.y) ** 2);
		lastPoint = point;
	}

	return length;
}

export function createDrawCurvedEdgeLabel<
	N extends Attributes = Attributes,
	E extends Attributes = Attributes,
	G extends Attributes = Attributes
>({
	curvatureAttribute,
	defaultCurvature,
	keepLabelUpright = true
}: CreateEdgeCurveProgramOptions & { keepLabelUpright?: boolean }): EdgeLabelDrawingFunction<
	N,
	E,
	G
> {
	return (context, edgeData, sourceData, targetData, settings: Settings<N, E, G>): void => {
		const size = settings.edgeLabelSize;
		const font = settings.edgeLabelFont;
		const weight = settings.edgeLabelWeight;
		const color = edgeData.labelColor
			? edgeData.labelColor
			: settings.edgeLabelColor.attribute
				? edgeData[settings.edgeLabelColor.attribute] ||
					settings.edgeLabelColor.color ||
					'#000'
				: settings.edgeLabelColor.color;
		const labelPadding = useGraphStore.getState().sigma.scaleSize(edgeData.labelPadding);
		const labelBackgroundColor = edgeData.labelBackgroundColor;
		const curvature = edgeData[curvatureAttribute] || defaultCurvature;
		let label = edgeData.label;

		if (!label) return;

		context.fillStyle = color;
		context.font = `${weight} ${size}px ${font}`;

		// Computing positions without considering nodes sizes:
		const ltr = !keepLabelUpright || sourceData.x < targetData.x;
		let sourceX = ltr ? sourceData.x : targetData.x;
		let sourceY = ltr ? sourceData.y : targetData.y;
		let targetX = ltr ? targetData.x : sourceData.x;
		let targetY = ltr ? targetData.y : sourceData.y;
		const centerX = (sourceX + targetX) / 2;
		const centerY = (sourceY + targetY) / 2;
		const diffX = targetX - sourceX;
		const diffY = targetY - sourceY;
		const diff = Math.sqrt(diffX ** 2 + diffY ** 2);
		// Anchor point:
		const orientation = ltr ? 1 : -1;
		let anchorX = centerX + diffY * curvature * orientation;
		let anchorY = centerY - diffX * curvature * orientation;

		const sourceOffsetVector = {
			x: anchorY - sourceY,
			y: -(anchorX - sourceX)
		};
		const sourceOffsetVectorLength = Math.sqrt(
			sourceOffsetVector.x ** 2 + sourceOffsetVector.y ** 2
		);
		const targetOffsetVector = {
			x: targetY - anchorY,
			y: -(targetX - anchorX)
		};
		const targetOffsetVectorLength = Math.sqrt(
			targetOffsetVector.x ** 2 + targetOffsetVector.y ** 2
		);
		sourceX += sourceOffsetVector.x / sourceOffsetVectorLength;
		sourceY += sourceOffsetVector.y / sourceOffsetVectorLength;
		targetX += targetOffsetVector.x / targetOffsetVectorLength;
		targetY += targetOffsetVector.y / targetOffsetVectorLength;
		// For anchor, the vector is simpler, so it is inlined:
		anchorX += diffY / diff;
		anchorY -= diffX / diff;

		// Compute curve length:
		const anchorPoint = { x: anchorX, y: anchorY };
		const sourcePoint = { x: sourceX, y: sourceY };
		const targetPoint = { x: targetX, y: targetY };
		const curveLength = getCurveLength(sourcePoint, anchorPoint, targetPoint);

		if (curveLength < sourceData.size + targetData.size) return;

		// Handling ellipsis
		let textLength = context.measureText(label).width;
		const availableTextLength = curveLength - sourceData.size - targetData.size;
		if (textLength > availableTextLength) {
			const ellipsis = '…';
			label = label + ellipsis;
			textLength = context.measureText(label).width;

			while (textLength > availableTextLength && label.length > 1) {
				label = label.slice(0, -2) + ellipsis;
				textLength = context.measureText(label).width;
			}

			if (label.length < 4) return;
		}

		let angle;
		const dx = targetData.x - sourceData.x;
		const dy = targetData.y - sourceData.y;
		const d = Math.sqrt(dx * dx + dy * dy);
		if (dx > 0) {
			if (dy > 0) angle = Math.acos(dx / d);
			else angle = Math.asin(dy / d);
		} else {
			if (dy > 0) angle = Math.acos(dx / d) + Math.PI;
			else angle = Math.asin(dx / d) + Math.PI / 2;
		}

		const labelMeasures = context.measureText(label);
		const labelHeight =
			labelMeasures.actualBoundingBoxAscent + labelMeasures.actualBoundingBoxDescent;
		const labelWidth =
			labelMeasures.actualBoundingBoxLeft + labelMeasures.actualBoundingBoxRight;
		const point = getCurvePoint(0.5, sourcePoint, anchorPoint, targetPoint);

		context.save();
		context.translate(point.x, point.y);
		context.rotate(angle);

		if (labelBackgroundColor !== undefined) {
			const previousFillStyle = context.fillStyle;

			context.fillStyle = labelBackgroundColor;
			context.fillRect(
				-labelWidth / 2 - labelPadding,
				-labelHeight / 2 - labelPadding,
				labelWidth + labelPadding * 2,
				labelHeight + labelPadding * 2
			);
			context.fillStyle = previousFillStyle;
		}

		context.textAlign = 'center';
		context.fillText(label, 0, labelHeight / 2 - labelMeasures.actualBoundingBoxDescent);
		context.restore();
	};
}
