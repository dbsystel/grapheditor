import { Node } from 'src/models/node';
import { RelationType } from 'src/models/relation';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type GetRelationEndSuggestionsParameters = {
	end: 'source' | 'target';
	neighborId?: string;
	relationType?: RelationType;
	text?: string;
	limit?: number;
};

export type GetRelationEndSuggestionsResponse = {
	modelDerived: Array<Node>;
	others: Array<Node>;
	hasMore: boolean;
};

export const getRelationEndSuggestions = (parameters: GetRelationEndSuggestionsParameters) => {
	return backendApi.get<GetRelationEndSuggestionsResponse>(
		endpoints.getRelationEndSuggestionsPath(parameters)
	);
};
