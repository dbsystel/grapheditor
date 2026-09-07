import { AxiosError, AxiosResponse } from 'axios';
import { api } from 'src/utils/api/api';
import {
	GetRelationTypeSuggestionsParameters,
	GetRelationTypeSuggestionsResponse
} from 'src/utils/fetch/getRelationTypeSuggestions';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type UseGetRelationTypeSuggestionsParameters = {
	onSuccess: (data: AxiosResponse<GetRelationTypeSuggestionsResponse>) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
} & GetRelationTypeSuggestionsParameters;

/**
 * Simple custom hook to fetch relatio type suggestions based on parameters.
 */
export const useGetRelationTypeSuggestions = ({
	onSuccess,
	onError,
	onFinally,
	sourceId,
	targetId,
	text,
	executeImmediately = false
}: UseGetRelationTypeSuggestionsParameters) => {
	return useApiHook<
		AxiosResponse<GetRelationTypeSuggestionsResponse>,
		GetRelationTypeSuggestionsParameters
	>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		fetchFunction: (parameters) => {
			return api.meta.fetch.getRelationTypeSuggestions({
				sourceId: parameters?.sourceId || sourceId,
				targetId: parameters?.targetId || targetId,
				text: parameters?.text || text
			});
		}
	});
};
