import { AxiosError, AxiosResponse } from 'axios';
import {
	postContextMenuActions,
	PostContextMenuActionsParameters,
	PostContextMenuActionsRequestResponse
} from 'src/utils/fetch/postContextMenuActions';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type UsePostContextMenuActionsParameters = {
	onSuccess?: (data: AxiosResponse<PostContextMenuActionsRequestResponse>) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
} & PostContextMenuActionsParameters;

/**
 * Simple custom hook to fetch context menu actions.
 */
export const usePostContextMenuActions = (
	{
		nodeIds,
		relationIds,
		onSuccess,
		onError,
		onFinally,
		executeImmediately = false
	}: UsePostContextMenuActionsParameters,
	dependencies?: Array<unknown>
) => {
	return useApiHook<
		AxiosResponse<PostContextMenuActionsRequestResponse>,
		PostContextMenuActionsParameters
	>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		fetchFunction: (parameters?: PostContextMenuActionsParameters) => {
			const params =
				typeof parameters === 'undefined'
					? { nodeIds: nodeIds, relationIds: relationIds }
					: { nodeIds: parameters.nodeIds, relationIds: parameters.relationIds };

			return postContextMenuActions(params);
		},
		dependencies: dependencies
	});
};
