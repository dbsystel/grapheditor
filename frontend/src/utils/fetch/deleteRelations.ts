import { AxiosResponse } from 'axios';
import { RelationId } from 'src/models/relation';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type DeleteRelationsParameters = { relationIds: Array<RelationId> };
export type DeleteRelationsServerParameters = { ids: Array<RelationId> };
export type DeleteRelationsResponse = { num_deleted: number; message: string };

export const deleteRelations = ({ relationIds }: DeleteRelationsParameters) => {
	return backendApi.delete<
		DeleteRelationsResponse,
		AxiosResponse<DeleteRelationsResponse>,
		DeleteRelationsServerParameters
	>(endpoints.getRelationsBulkDeletePath(), {
		data: {
			ids: relationIds
		}
	});
};
