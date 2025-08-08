import { NodeSquareProgram } from '@sigma/node-square';
import { createNodeCompoundProgram } from 'sigma/rendering';
import {
	GraphEditorSigmaNodeAttributes,
	GraphEditorSigmaRelationAttributes
} from 'src/components/network-graph/NetworkGraph.interfaces';
import { GRAPH_DEFAULT_NODE_BORDER_WIDTH } from 'src/utils/constants';
import { createNodeBorderProgram } from '../../overrides/nodes/borders';

const NodeBorderCustomProgram = createNodeBorderProgram<
	GraphEditorSigmaNodeAttributes,
	GraphEditorSigmaRelationAttributes
>({
	borders: [
		{
			size: {
				attribute: 'borderSize',
				mode: 'relative',
				defaultValue: GRAPH_DEFAULT_NODE_BORDER_WIDTH
			},
			color: { attribute: 'borderColor' }
		},
		{
			size: { fill: true },
			color: { attribute: 'color' }
		}
	]
});

export const SquareNodeWithBorderProgram = createNodeCompoundProgram<
	GraphEditorSigmaNodeAttributes,
	GraphEditorSigmaRelationAttributes
>([NodeSquareProgram, NodeBorderCustomProgram]);
