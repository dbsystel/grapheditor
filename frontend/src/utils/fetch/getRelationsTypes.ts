import { RelationType } from 'src/models/relation';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type GetRelationsTypesResponse = { types: Array<RelationType> };

export const getRelationsTypes = () => {
	return backendApi.get<GetRelationsTypesResponse>(endpoints.getRelationsTypesPath());
};
