import {
	GraphEditorSigmaNodeAttributes,
	GraphEditorSigmaRelationAttributes
} from 'src/components/network-graph/NetworkGraph.interfaces';
import { createEdgeCurveProgram } from 'src/components/network-graph/overrides/relations/curved';
import {
	GRAPH_ARROW_HEAD_LENGTH_TO_THICKNESS_RATIO,
	GRAPH_ARROW_HEAD_WIDENESS_TO_THICKNESS_RATIO
} from 'src/utils/constants';

export const CurvedEdgeArrowProgram = createEdgeCurveProgram<
	GraphEditorSigmaNodeAttributes,
	GraphEditorSigmaRelationAttributes
>({
	arrowHead: {
		extremity: 'target',
		lengthToThicknessRatio: GRAPH_ARROW_HEAD_LENGTH_TO_THICKNESS_RATIO,
		widenessToThicknessRatio: GRAPH_ARROW_HEAD_WIDENESS_TO_THICKNESS_RATIO
	}
});
