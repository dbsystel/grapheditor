import { Attributes } from 'graphology-types';
import { Settings } from 'sigma/settings';
import { NodeDisplayData, PartialButFor } from 'sigma/types';
import { drawNodeLabel } from 'src/components/network-graph/overrides/nodes/labels/draw-node-label';
import { useGraphStore } from 'src/stores/graph';

export function drawNodeHover<
	N extends Attributes = Attributes,
	E extends Attributes = Attributes,
	G extends Attributes = Attributes
>(
	context: CanvasRenderingContext2D,
	data: PartialButFor<NodeDisplayData, 'x' | 'y' | 'size' | 'label' | 'color'>,
	settings: Settings<N, E, G>
): void {
	// The "renderLabels" Sigma.js option didn't work since it would prevent relation
	// labels to render, because relation labels rely on rendered node labels.
	// Date of deactivation: 19.02.2025
	// Note: simple function return didn't work, that's why we have a funny "if"
	// condition below
	if (!data.label || data.label) return;

	const BORDER_WIDTH = useGraphStore.getState().sigma.scaleSize(2);

	// style shadow
	context.shadowOffsetX = 0;
	context.shadowOffsetY = 0;
	context.shadowBlur = 8;
	context.shadowColor = '#000000';
	context.strokeStyle = '#ffffff';
	context.lineWidth = BORDER_WIDTH;

	// draw shadow
	context.strokeRect(
		data.x - data.size - BORDER_WIDTH / 2,
		data.y - data.size - BORDER_WIDTH / 2,
		data.size * 2 + BORDER_WIDTH,
		data.size * 2 + BORDER_WIDTH
	);
	// clear inner shadow (make pixels transparent)
	context.clearRect(data.x - data.size, data.y - data.size, data.size * 2, data.size * 2);

	// clear shadow settings
	context.shadowOffsetX = 0;
	context.shadowOffsetY = 0;
	context.shadowBlur = 0;

	// draw the label
	drawNodeLabel(context, data, settings);
}
