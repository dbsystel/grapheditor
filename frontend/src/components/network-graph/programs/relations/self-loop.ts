import {
	GraphEditorSigmaNodeAttributes,
	GraphEditorSigmaRelationAttributes
} from 'src/components/network-graph/NetworkGraph.interfaces';
import { createEdgeSelfLoopProgram } from 'src/components/network-graph/overrides/relations/self-loop';
import {
	GRAPH_ARROW_HEAD_LENGTH_TO_THICKNESS_RATIO,
	GRAPH_ARROW_HEAD_WIDENESS_TO_THICKNESS_RATIO
} from 'src/utils/constants';

export const SelfLoopEdgeArrowProgram = createEdgeSelfLoopProgram<
	GraphEditorSigmaNodeAttributes,
	GraphEditorSigmaRelationAttributes
>({
	arrowHead: {
		extremity: 'both',
		lengthToThicknessRatio: GRAPH_ARROW_HEAD_LENGTH_TO_THICKNESS_RATIO,
		widenessToThicknessRatio: GRAPH_ARROW_HEAD_WIDENESS_TO_THICKNESS_RATIO
	}
});
