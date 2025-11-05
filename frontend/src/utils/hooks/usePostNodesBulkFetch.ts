import { AxiosError } from 'axios';
import { Node } from 'src/models/node';
import { nodesApi } from 'src/utils/api/nodes';
import { PostNodesBulkFetchParameters } from 'src/utils/fetch/postNodesBulkFetch';
import { PostParallaxParameters } from 'src/utils/fetch/postParallax';
import { useApiHook } from 'src/utils/hooks/useApiHook';

type PostNodesBulkFetchResponse = Array<Node>;

export type UsePostParallaxParameters = {
	onSuccess: (data: PostNodesBulkFetchResponse) => void;
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
	return useApiHook<PostNodesBulkFetchResponse, PostNodesBulkFetchParameters>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		dependencies: dependencies,
		fetchFunction: (parameters?: PostNodesBulkFetchParameters) => {
			return nodesApi.postNodesBulkFetch({ nodeIds: parameters?.nodeIds || nodeIds });
		}
	});
};
