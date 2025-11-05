import { AxiosResponse } from 'axios';
import { ItemProperties } from 'src/models/item';
import { Node, NodeLabels } from 'src/models/node';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type PostNodeParameters = {
	labels: NodeLabels;
	properties: ItemProperties;
};
export type PostNodeResponse = Node;

export const postNode = ({ labels, properties }: PostNodeParameters) => {
	return backendApi.post<PostNodeResponse, AxiosResponse<PostNodeResponse>, PostNodeParameters>(
		endpoints.getNodesPath(),
		{
			labels: labels,
			properties: properties
		}
	);
};
