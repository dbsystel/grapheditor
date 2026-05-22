import { AxiosResponse } from 'axios';
import { ParaQueryParameterValues } from 'src/models/paraquery';
import { CypherQuerySearchResult } from 'src/types/cypherQuerySearchResult';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type PostCypherQuerySearchParameters = {
	queryText: string;
	parameters?: ParaQueryParameterValues;
};
type PostCypherQuerySearchServerParameters = {
	querytext: PostCypherQuerySearchParameters['queryText'];
	parameters?: PostCypherQuerySearchParameters['parameters'];
};
export type PostCypherQuerySearchResponse = {
	result: CypherQuerySearchResult;
};

export const postCypherQuerySearch = ({
	queryText,
	parameters
}: PostCypherQuerySearchParameters) => {
	return backendApi.post<
		PostCypherQuerySearchResponse,
		AxiosResponse<PostCypherQuerySearchResponse>,
		PostCypherQuerySearchServerParameters
	>(endpoints.getGlobalSearchPath(), { querytext: queryText, parameters: parameters });
};
