import { AxiosError, AxiosResponse } from 'axios';
import { api } from 'src/utils/api/api';
import { PostParaQueryParameters, PostParaQueryResponse } from 'src/utils/fetch/postParaQuery';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type UsePostParaQueryParameters = {
	onSuccess: (data: AxiosResponse<PostParaQueryResponse>) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
} & PostParaQueryParameters;

/**
 * Simple custom hook to fetch a specific ParaQuery.
 */
export const usePostParaQuery = (
	{
		paraQueryId,
		parameters,
		onSuccess,
		onError,
		onFinally,
		executeImmediately = true
	}: UsePostParaQueryParameters,
	dependencies?: Array<unknown>
) => {
	return useApiHook<AxiosResponse<PostParaQueryResponse>, PostParaQueryParameters>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		dependencies: dependencies,
		fetchFunction: (params?: PostParaQueryParameters) =>
			api.paraQueries.fetch.postParaQuery({
				paraQueryId: params?.paraQueryId || paraQueryId,
				parameters: params?.parameters || parameters
			})
	});
};
