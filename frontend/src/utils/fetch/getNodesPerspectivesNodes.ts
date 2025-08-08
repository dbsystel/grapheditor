import { Node } from 'src/models/node';
import { getNodes } from 'src/utils/fetch/getNodes';

export type GetNodesPerspectivesNodesResponse = Array<Node>;

export const getNodesPerspectivesNodes = async () => {
	return getNodes({ labels: ['Perspective__tech_'] }).then((response) => {
		return response.data;
	});
};
