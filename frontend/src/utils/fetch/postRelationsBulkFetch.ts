import { AxiosResponse } from 'axios';
import { Relation, RelationId } from 'src/models/relation';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type PostRelationsBulkFetchParameters = {
	relationIds: Array<RelationId>;
};

type PostRelationsBulkFetchResponse = {
	relations: Record<RelationId, Relation>;
};

type PostRelationsBulkFetchAxiosParameters = {
	ids: Array<RelationId>;
};

export const postRelationsBulkFetch = async ({ relationIds }: PostRelationsBulkFetchParameters) => {
	return backendApi.post<
		PostRelationsBulkFetchResponse,
		AxiosResponse<PostRelationsBulkFetchResponse>,
		PostRelationsBulkFetchAxiosParameters
	>(endpoints.getRelationsBulkFetchPath(), { ids: relationIds });
};
