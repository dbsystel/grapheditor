import { AxiosResponse } from 'axios';
import { RelationId } from 'src/models/relation';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type DeleteRelationParameters = { relationId: RelationId };
export type DeleteRelationResponse = { num_deleted: number; message: string };

export const deleteRelation = ({ relationId }: DeleteRelationParameters) => {
	return backendApi.delete<DeleteRelationResponse, AxiosResponse<DeleteRelationResponse>>(
		endpoints.getRelationPath({ relationId: relationId })
	);
};
