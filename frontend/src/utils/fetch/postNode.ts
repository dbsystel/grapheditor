import { AxiosResponse } from 'axios';
import { FormItemPostProperties } from 'src/models/general';
import { Node, NodeLabels } from 'src/models/node';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type PostNodeParameters = {
	labels: NodeLabels;
	properties: FormItemPostProperties;
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
