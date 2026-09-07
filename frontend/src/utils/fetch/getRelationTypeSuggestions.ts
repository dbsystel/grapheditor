import { Node } from 'src/models/node';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type GetRelationTypeSuggestionsParameters = {
	sourceId?: string;
	targetId?: string;
	text?: string;
	limit?: number;
};

export type GetRelationTypeSuggestionsResponse = {
	modelDerived: Array<Node>;
	others: Array<Node>;
	hasMore: boolean;
};

export const getRelationTypeSuggestions = (parameters: GetRelationTypeSuggestionsParameters) => {
	return backendApi.get<GetRelationTypeSuggestionsResponse>(
		endpoints.getRelationTypeSuggestionsPath(parameters)
	);
};
