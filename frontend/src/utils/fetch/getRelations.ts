import { Relation } from 'src/models/relation';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type GetRelationsParameters = {
	searchTerm?: string;
};

export type GetRelationsResponse = Array<Relation>;

export const getRelations = ({ searchTerm }: GetRelationsParameters) => {
	return backendApi.get<GetRelationsResponse>(
		endpoints.getRelationsPath({ searchTerm: searchTerm })
	);
};
