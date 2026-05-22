import { AxiosResponse } from 'axios';
import { ItemProperties } from 'src/models/item';
import { Relation, RelationId, RelationType } from 'src/models/relation';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type PostRelationParameters = {
	properties: ItemProperties;
	sourceId: RelationId;
	targetId: RelationId;
	type: RelationType;
};
type PostRelationServerParameters = Pick<PostRelationParameters, 'properties' | 'type'> & {
	source_id: PostRelationParameters['sourceId'];
	target_id: PostRelationParameters['targetId'];
};
export type PostRelationResponse = Relation;

export const postRelation = ({ properties, sourceId, targetId, type }: PostRelationParameters) => {
	return backendApi.post<
		PostRelationResponse,
		AxiosResponse<PostRelationResponse>,
		PostRelationServerParameters
	>(endpoints.getRelationsPath(), {
		properties: properties,
		source_id: sourceId,
		target_id: targetId,
		type: type
	});
};
