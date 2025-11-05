import { deleteNodes } from 'src/utils/fetch/deleteNodes';
import { getNode } from 'src/utils/fetch/getNode';
import { getNodes } from 'src/utils/fetch/getNodes';
import { getNodesDefaultLabelNodes } from 'src/utils/fetch/getNodesDefaultLabelNodes';
import { getNodesLabels } from 'src/utils/fetch/getNodesLabels';
import { getNodesLabelsNodes } from 'src/utils/fetch/getNodesLabelsNodes';
import { getNodesPerspectivesNodes } from 'src/utils/fetch/getNodesPerspectivesNodes';
import { getNodesProperties } from 'src/utils/fetch/getNodesProperties';
import { getNodesPropertiesNodes } from 'src/utils/fetch/getNodesPropertiesNodes';
import { getPerspective } from 'src/utils/fetch/getPerspective';
import { patchNode } from 'src/utils/fetch/patchNode';
import { patchNodes } from 'src/utils/fetch/patchNodes';
import { postNode } from 'src/utils/fetch/postNode';
import { postNodeConnections } from 'src/utils/fetch/postNodeConnections';
import { postNodes } from 'src/utils/fetch/postNodes';
import { postNodesBulkFetch } from 'src/utils/fetch/postNodesBulkFetch';
import { postNodesLabelsDefault } from 'src/utils/fetch/postNodesLabelsDefault';
import { postPerspective } from 'src/utils/fetch/postPerspective';
import { putPerspective } from 'src/utils/fetch/putPerspective';
import {
	deleteNodesAndUpdateApplication,
	patchNodesAndUpdateApplication
} from 'src/utils/helpers/nodes';

export const nodesApi = {
	deleteNodes: deleteNodes,
	deleteNodesAndUpdateApplication: deleteNodesAndUpdateApplication,
	getNode: getNode,
	getNodes: getNodes,
	getNodesDefaultLabelNodes: getNodesDefaultLabelNodes,
	getNodesLabels: getNodesLabels,
	getNodesLabelsNodes: getNodesLabelsNodes,
	getNodesPerspectivesNodes: getNodesPerspectivesNodes,
	getNodesProperties: getNodesProperties,
	getNodesPropertiesNodes: getNodesPropertiesNodes,
	getPerspective: getPerspective,
	patchNode: patchNode,
	patchNodes: patchNodes,
	patchNodesAndUpdateApplication: patchNodesAndUpdateApplication,
	postNode: postNode,
	postNodes: postNodes,
	postNodeConnections: postNodeConnections,
	postNodesBulkFetch: postNodesBulkFetch,
	postNodesLabelsDefault: postNodesLabelsDefault,
	postPerspective: postPerspective,
	putPerspective: putPerspective
};
