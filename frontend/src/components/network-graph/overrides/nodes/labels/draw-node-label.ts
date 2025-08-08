import { Attributes } from 'graphology-types';
import { Settings } from 'sigma/settings';
import { NodeDisplayData, PartialButFor } from 'sigma/types';
import {
	convertNodeGraphSizeToStyleSize,
	replaceFontSizeInFont
} from 'src/components/network-graph/helpers';
import { useGraphStore } from 'src/stores/graph';
import { GRAPH_HIDE_LABEL_BOX_SPACING } from 'src/utils/constants';

export function drawNodeLabel<
	N extends Attributes = Attributes,
	E extends Attributes = Attributes,
	G extends Attributes = Attributes
>(
	context: CanvasRenderingContext2D,
	// TODO improve typing after #700 is merged
	data: PartialButFor<
		NodeDisplayData & { labelColor?: string },
		'x' | 'y' | 'size' | 'label' | 'color' | 'labelColor'
	>,
	settings: Settings<N, E, G>
): void {
	// The "renderLabels" Sigma.js option didn't work since it would prevent relation
	// labels to render, because relation labels rely on rendered node labels.
	// Date of deactivation: 19.02.2025
	// Note: simple function return didn't work, that's why we have a funny "if"
	// condition below
	if (!data.label || data.label) return;

	const MARGIN = useGraphStore.getState().sigma.scaleSize(GRAPH_HIDE_LABEL_BOX_SPACING);

	const label = data.label;
	const labelSize = settings.labelSize;
	const labelFontFamily = settings.labelFont;
	const labelFontWeight = settings.labelWeight;
	const nodeWidth = convertNodeGraphSizeToStyleSize(data.size);
	const nodeBorderWidth = (nodeWidth * data.borderSize) / 2;
	const nodeWidthWithoutBorder = nodeWidth - nodeBorderWidth * 2;
	const color = data.labelColor
		? data.labelColor
		: settings.labelColor.attribute
			? data[settings.labelColor.attribute] || settings.labelColor.color || '#000'
			: settings.labelColor.color;

	context.fillStyle = color;
	context.textBaseline = 'ideographic';

	const textX = data.x - data.size + nodeBorderWidth + MARGIN;
	let textY = data.y - data.size + nodeBorderWidth + MARGIN;

	const { lines, fontSize, lineHeight } = fitTextToCanvas(
		context,
		label,
		nodeWidthWithoutBorder - MARGIN * 2,
		nodeWidthWithoutBorder - MARGIN * 2,
		labelSize
	);
	context.font = `${labelFontWeight} ${fontSize}px ${labelFontFamily}`;

	for (let i = 0; i < lines.length; i++) {
		textY += lineHeight;
		context.fillText(lines[i], textX, textY);
	}
}

function fitTextToCanvas(
	context: CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
	maxHeight: number,
	initialFontSize: number
) {
	let fontSize = initialFontSize;
	let lines;
	let lineHeight;

	context.font = replaceFontSizeInFont(context.font, fontSize);
	lineHeight = fontSize * 1.2;
	lines = getWrappedText(context, text, maxWidth);

	// Check if the text fits within the canvas
	while (
		lines.length * lineHeight > maxHeight ||
		Math.max(...lines.map((line) => context.measureText(line).width)) > maxWidth
	) {
		fontSize--;
		context.font = replaceFontSizeInFont(context.font, fontSize);
		lineHeight = fontSize * 1.2;
		lines = getWrappedText(context, text, maxWidth);
		if (fontSize <= 1) break;
	}

	return { lines, fontSize, lineHeight };
}

function getWrappedText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
	let line = '';
	const lines = [];
	for (let i = 0; i < text.length; i++) {
		const testLine = line + text[i];
		const metrics = ctx.measureText(testLine);
		const testWidth = metrics.width;

		if (testWidth > maxWidth && line !== '') {
			lines.push(line);
			line = text[i];
		} else {
			line = testLine;
		}
	}
	lines.push(line);
	return lines;
}
