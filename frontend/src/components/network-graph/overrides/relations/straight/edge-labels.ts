import { Attributes } from 'graphology-types';
import { Settings } from 'sigma/settings';
import { EdgeDisplayData, NodeDisplayData, PartialButFor } from 'sigma/types';
import { useGraphStore } from 'src/stores/graph';

export function drawRelationLabel<
	N extends Attributes = Attributes,
	E extends Attributes = Attributes,
	G extends Attributes = Attributes
>(
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
): void {
	const size = settings.edgeLabelSize;
	const font = settings.edgeLabelFont;
	const weight = settings.edgeLabelWeight;
	const color = edgeData.labelColor
		? edgeData.labelColor
		: settings.edgeLabelColor.attribute
			? edgeData[settings.edgeLabelColor.attribute] || settings.edgeLabelColor.color || '#000'
			: settings.edgeLabelColor.color;
	const labelPadding = useGraphStore.getState().sigma.scaleSize(edgeData.labelPadding);
	const labelBackgroundColor = edgeData.labelBackgroundColor;

	let label = edgeData.label;

	if (!label) return;

	context.fillStyle = color;
	context.font = `${weight} ${size}px ${font}`;

	// Computing positions without considering nodes sizes:
	const sSize = sourceData.size;
	const tSize = targetData.size;
	let sx = sourceData.x;
	let sy = sourceData.y;
	let tx = targetData.x;
	let ty = targetData.y;
	let cx = (sx + tx) / 2;
	let cy = (sy + ty) / 2;
	let dx = tx - sx;
	let dy = ty - sy;
	let d = Math.sqrt(dx * dx + dy * dy);

	if (d < sSize + tSize) return;

	// Adding nodes sizes:
	sx += (dx * sSize) / d;
	sy += (dy * sSize) / d;
	tx -= (dx * tSize) / d;
	ty -= (dy * tSize) / d;
	cx = (sx + tx) / 2;
	cy = (sy + ty) / 2;
	dx = tx - sx;
	dy = ty - sy;
	d = Math.sqrt(dx * dx + dy * dy);

	// Handling ellipsis
	let textLength = context.measureText(label).width;

	if (textLength > d) {
		const ellipsis = '…';
		label = label + ellipsis;
		textLength = context.measureText(label).width;

		while (textLength > d && label.length > 1) {
			label = label.slice(0, -2) + ellipsis;
			textLength = context.measureText(label).width;
		}

		if (label.length < 4) return;
	}

	let angle;
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
	const labelWidth = labelMeasures.actualBoundingBoxLeft + labelMeasures.actualBoundingBoxRight;

	context.save();
	context.translate(cx, cy);
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

	/**
	 * For the "y" axis we use "- labelMeasures.actualBoundingBoxDescent" for
	 * (almost) perfect positioning of the label. This covers capital letters
	 * and characters rendered below the alphabetic baseline (e.g. g,y,p,;,...)
	 */
	context.fillText(
		label,
		-labelWidth / 2,
		labelHeight / 2 - labelMeasures.actualBoundingBoxDescent
	);

	context.restore();
}
