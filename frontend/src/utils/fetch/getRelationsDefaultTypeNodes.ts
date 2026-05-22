import { Node } from 'src/models/node';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type GetRelationsDefaultTypeNodesResponse = { node: Node };

export const getRelationsDefaultTypeNodes = () => {
	return backendApi.get<GetRelationsDefaultTypeNodesResponse>(
		endpoints.getRelationsTypesDefaultPath()
	);
};
