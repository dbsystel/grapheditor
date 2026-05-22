import { AxiosResponse } from 'axios';
import { PatchRelation, Relation, RelationId } from 'src/models/relation';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type PatchRelationsParameters = Array<PatchRelation>;
export type PatchRelationsServerParameters = {
	patches: Array<PatchRelation>;
};
export type PatchRelationsResponse = {
	// key: old relation ID, value: new relation (important when changing relation type)
	relations: Record<RelationId, Relation>;
};

export const patchRelations = (relations: PatchRelationsParameters) => {
	return backendApi.patch<
		PatchRelationsResponse,
		AxiosResponse<PatchRelationsResponse>,
		PatchRelationsServerParameters
	>(endpoints.getRelationsBulkPatchPath(), {
		patches: relations
	});
};
