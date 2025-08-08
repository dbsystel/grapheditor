import { AxiosResponse } from 'axios';
import { RelationType } from 'src/models/relation';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type PostRelationDefaultTypeNodeParameters = {
	typeId: RelationType;
};
type PostRelationDefaultTypeNodeServerParameters = {
	type_id: PostRelationDefaultTypeNodeParameters['typeId'];
};
export type PostRelationDefaultTypeNodeResponse = string;

export const postRelationDefaultTypeNode = ({ typeId }: PostRelationDefaultTypeNodeParameters) => {
	return backendApi.post<
		PostRelationDefaultTypeNodeResponse,
		AxiosResponse<PostRelationDefaultTypeNodeResponse>,
		PostRelationDefaultTypeNodeServerParameters
	>(endpoints.getRelationsTypesDefaultPath(), {
		type_id: typeId
	});
};
