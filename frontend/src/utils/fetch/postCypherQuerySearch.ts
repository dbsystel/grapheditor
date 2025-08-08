import { AxiosResponse } from 'axios';
import { CypherQuerySearchResult } from 'src/types/cypherQuerySearchResult';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type PostCypherQuerySearchParameters = {
	queryText: string;
};
type PostCypherQuerySearchServerParameters = {
	querytext: PostCypherQuerySearchParameters['queryText'];
};
export type PostCypherQuerySearchResponse = {
	result: CypherQuerySearchResult;
};

export const postCypherQuerySearch = ({ queryText }: PostCypherQuerySearchParameters) => {
	return backendApi.post<
		PostCypherQuerySearchResponse,
		AxiosResponse<PostCypherQuerySearchResponse>,
		PostCypherQuerySearchServerParameters
	>(endpoints.getGlobalSearchPath(), { querytext: queryText });
};
