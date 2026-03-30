import { Attributes } from 'graphology-types';
import { Settings } from 'sigma/settings';
import { EdgeDisplayData, NodeDisplayData, PartialButFor } from 'sigma/types';
import { useGraphStore } from 'src/stores/graph';
import { CreateEdgeSelfLoopProgramOptions, DEFAULT_SELF_LOOP_CURVATURE } from './factory';

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

/**
 * Creates a label drawing function for self-loop edges.
 * The label is positioned above the node, at the top of the loop arc.
 * The curvature value scales the loop, so labels on different self-loops
 * are placed at correspondingly different heights.
 */
export function drawSelfLoopLabel<
	N extends Attributes = Attributes,
	E extends Attributes = Attributes,
	G extends Attributes = Attributes
>({
	curvatureAttribute = 'curvature',
	defaultCurvature = DEFAULT_SELF_LOOP_CURVATURE
}: CreateEdgeSelfLoopProgramOptions): EdgeLabelDrawingFunction<N, E, G> {
	return (context, edgeData, sourceData, _targetData, settings: Settings<N, E, G>): void => {
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

		let label = edgeData.label;
		if (!label) return;

		context.fillStyle = color;
		context.font = `${weight} ${size}px ${font}`;

		// Position the label above the node at the top of the self-loop.
		// Match the shader: the loop apex (cpC) is at nodeSize + scaledRadius above center.
		// Scale by curvature to match the shader's curvatureScale = 1.0 + abs(curvature) * 4.0
		const curvature = (edgeData[curvatureAttribute as 'size'] as number) ?? defaultCurvature;
		const curvatureScale = 1.0 + Math.abs(curvature) * 4.0;
		const scaledRadius = useGraphStore.getState().sigma.scaleSize(30) * curvatureScale;
		const nodeSize = sourceData.size;
		const loopApexHeight = nodeSize + scaledRadius;
		const labelX = sourceData.x;
		const labelY = sourceData.y - loopApexHeight;
		// Handling ellipsis — use a generous max width relative to the loop size
		const maxWidth = Math.max(scaledRadius * 3, nodeSize * 4);
		let textLength = context.measureText(label).width;

		if (textLength > maxWidth) {
			const ellipsis = '…';
			label = label + ellipsis;
			textLength = context.measureText(label).width;

			while (textLength > maxWidth && label.length > 1) {
				label = label.slice(0, -2) + ellipsis;
				textLength = context.measureText(label).width;
			}

			if (label.length < 4) return;
		}

		const labelMeasures = context.measureText(label);
		const labelHeight =
			labelMeasures.actualBoundingBoxAscent + labelMeasures.actualBoundingBoxDescent;
		const labelWidth =
			labelMeasures.actualBoundingBoxLeft + labelMeasures.actualBoundingBoxRight;

		context.save();
		context.translate(labelX, labelY);

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
