import { AxiosResponse } from 'axios';
import { ItemProperties } from 'src/models/item';
import { Relation, RelationId } from 'src/models/relation';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type PatchRelationParameters = {
	relationId: RelationId;
	type?: string;
	properties?: ItemProperties;
};
type PatchRelationServerParameters = Pick<PatchRelationParameters, 'type' | 'properties'>;
export type PathRelationResponse = Relation;

export const patchRelation = ({ relationId, type, properties }: PatchRelationParameters) => {
	return backendApi.patch<
		PathRelationResponse,
		AxiosResponse<PathRelationResponse>,
		PatchRelationServerParameters
	>(endpoints.getRelationPath({ relationId: relationId }), {
		type: type,
		properties: properties
	});
};
