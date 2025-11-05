import { AxiosResponse } from 'axios';
import { ItemProperties } from 'src/models/item';
import { Relation, RelationId, RelationType } from 'src/models/relation';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';
import { PostRelationParameters } from 'src/utils/fetch/postRelation';

export type PostRelationsParameters = Array<PostRelationsParameter>;
export type PostRelationsParameter = {
	type: RelationType;
	properties: ItemProperties;
	sourceId: RelationId;
	targetId: RelationId;
};
type PostRelationsServerParameters = {
	relations: Array<
		Pick<PostRelationsParameter, 'properties' | 'type'> & {
			source_id: PostRelationParameters['sourceId'];
			target_id: PostRelationParameters['targetId'];
		}
	>;
};
export type PostRelationsResponse = { relations: Record<RelationId, Relation> };

export const postRelations = (relations: PostRelationsParameters) => {
	return backendApi.post<
		PostRelationsResponse,
		AxiosResponse<PostRelationsResponse>,
		PostRelationsServerParameters
	>(endpoints.getRelationsBulkPostPath(), {
		relations: relations.map((relation) => {
			return {
				type: relation.type,
				properties: relation.properties,
				source_id: relation.sourceId,
				target_id: relation.targetId
			};
		})
	});
};
