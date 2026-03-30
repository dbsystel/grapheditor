import { AxiosError, AxiosResponse } from 'axios';
import { api } from 'src/utils/api/api';
import { GetParaQueryParameters, GetParaQueryResponse } from 'src/utils/fetch/getParaQuery';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type UseGetParaQueryParameters = {
	onSuccess: (data: AxiosResponse<GetParaQueryResponse>) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
} & GetParaQueryParameters;

/**
 * Simple custom hook to fetch a specific ParaQuery.
 */
export const useGetParaQuery = (
	{
		paraQueryId,
		onSuccess,
		onError,
		onFinally,
		executeImmediately = true
	}: UseGetParaQueryParameters,
	dependencies?: Array<unknown>
) => {
	return useApiHook<AxiosResponse<GetParaQueryResponse>, GetParaQueryParameters>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		dependencies: dependencies,
		fetchFunction: (parameters?: GetParaQueryParameters) =>
			api.paraQueries.fetch.getParaQuery({
				paraQueryId: parameters?.paraQueryId || paraQueryId
			})
	});
};
