import { AxiosError, AxiosResponse } from 'axios';
import { api } from 'src/utils/api/api';
import { GetParaQueriesResponse } from 'src/utils/fetch/getParaQueries';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type UseGetParaQueriesParameters = {
	onSuccess: (data: AxiosResponse<GetParaQueriesResponse>) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
};

/**
 * Simple custom hook to fetch para-queries.
 */
export const useGetParaQueries = ({
	onSuccess,
	onError,
	onFinally,
	executeImmediately
}: UseGetParaQueriesParameters) => {
	return useApiHook<AxiosResponse<GetParaQueriesResponse>>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		fetchFunction: api.paraQueries.fetch.getParaQueries
	});
};
