import { Relation, RelationId } from 'src/models/relation';
import { backendApi } from 'src/utils/backend-api';
import { endpoints } from 'src/utils/endpoints';

export type GetRelationParameters = {
	relationId: RelationId;
};
export type GetRelationResponse = Relation;

export const getRelation = ({ relationId }: GetRelationParameters) => {
	return backendApi.get<GetRelationResponse>(
		endpoints.getRelationPath({ relationId: relationId })
	);
};
