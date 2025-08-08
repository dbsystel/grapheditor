import { Node } from 'src/models/node';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

type GetNodesParameters = {
	searchTerm?: string;
	labels?: Array<string>;
};

export type GetNodesResponse = Array<Node>;

export const getNodes = ({ searchTerm, labels }: GetNodesParameters) => {
	return backendApi.get<GetNodesResponse>(
		endpoints.getNodesPath({ searchTerm: searchTerm, labels: labels })
	);
};
