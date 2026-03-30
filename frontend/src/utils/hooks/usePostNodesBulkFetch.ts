import { AxiosError, AxiosResponse } from 'axios';
import { api } from 'src/utils/api/api';
import {
	PostNodesBulkFetchParameters,
	PostNodesBulkFetchResponse
} from 'src/utils/fetch/postNodesBulkFetch';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type UsePostParallaxParameters = {
	onSuccess: (data: AxiosResponse<PostNodesBulkFetchResponse>) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
} & PostNodesBulkFetchParameters;

/**
 * Custom hook to execute Parallax queries.
 */
export const usePostNodesBulkFetch = (
	{
		onSuccess,
		onError,
		onFinally,
		executeImmediately = false,
		nodeIds
	}: UsePostParallaxParameters,
	dependencies?: Array<unknown>
) => {
	return useApiHook<AxiosResponse<PostNodesBulkFetchResponse>, PostNodesBulkFetchParameters>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		dependencies: dependencies,
		fetchFunction: (parameters?: PostNodesBulkFetchParameters) => {
			return api.nodes.fetch.postNodesBulkFetch({ nodeIds: parameters?.nodeIds || nodeIds });
		}
	});
};
