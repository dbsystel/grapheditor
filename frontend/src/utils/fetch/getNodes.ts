import { Node } from 'src/models/node';
import { StoppableRequest } from 'src/models/stoppable-request';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

type GetNodesParameters = {
	searchTerm?: string;
	labels?: Array<string>;
	stoppableRequest?: StoppableRequest;
};

export type GetNodesResponse = Array<Node>;

export const getNodes = ({ searchTerm, labels, stoppableRequest }: GetNodesParameters) => {
	return backendApi.get<GetNodesResponse>(
		endpoints.getNodesPath({ searchTerm: searchTerm, labels: labels }),
		{
			applicationStoppableRequest: stoppableRequest
		}
	);
};
