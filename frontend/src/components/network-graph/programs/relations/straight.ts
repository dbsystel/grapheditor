import { createEdgeClampedProgram } from 'src/components/network-graph/overrides/relations/straight';
import {
	GRAPH_ARROW_HEAD_LENGTH_TO_THICKNESS_RATIO,
	GRAPH_ARROW_HEAD_WIDENESS_TO_THICKNESS_RATIO
} from 'src/utils/constants';

export const StraightEdgeArrowProgram = createEdgeClampedProgram({
	arrowHead: {
		extremity: 'target',
		lengthToThicknessRatio: GRAPH_ARROW_HEAD_LENGTH_TO_THICKNESS_RATIO,
		widenessToThicknessRatio: GRAPH_ARROW_HEAD_WIDENESS_TO_THICKNESS_RATIO
	}
});
