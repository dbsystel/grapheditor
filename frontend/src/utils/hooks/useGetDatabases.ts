import { AxiosError, AxiosResponse } from 'axios';
import { getDatabases, GetDatabasesResponse } from 'src/utils/fetch/getDatabases';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type GetDatabasesParameters = {
	onSuccess: (data: AxiosResponse<GetDatabasesResponse>) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
};

/**
 * Simple custom hook to fetch database infos.
 */
export const useGetDatabases = ({
	onSuccess,
	onError,
	onFinally,
	executeImmediately = false
}: GetDatabasesParameters) => {
	return useApiHook<AxiosResponse<GetDatabasesResponse>>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		fetchFunction: getDatabases
	});
};
