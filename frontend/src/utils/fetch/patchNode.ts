import { AxiosResponse } from 'axios';
import { ItemProperties } from 'src/models/item';
import { Node, NodeId } from 'src/models/node';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type PatchNodeParameters = {
	nodeId: NodeId;
	labels?: Array<string>;
	properties?: ItemProperties;
};
type PatchNodeServerParameters = Pick<PatchNodeParameters, 'labels' | 'properties'>;
export type PatchNodeResponse = Node;

export const patchNode = ({ nodeId, labels, properties }: PatchNodeParameters) => {
	return backendApi.patch<
		PatchNodeResponse,
		AxiosResponse<PatchNodeResponse>,
		PatchNodeServerParameters
	>(endpoints.getNodePath({ nodeId: nodeId }), {
		labels: labels,
		properties: properties
	});
};
