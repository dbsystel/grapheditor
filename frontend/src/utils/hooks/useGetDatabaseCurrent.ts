import { AxiosError, AxiosResponse } from 'axios';
import {
	getDatabaseCurrent,
	GetDatabasesCurrentResponse
} from 'src/utils/fetch/getDatabaseCurrent';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type GetDatabasesParameters = {
	onSuccess: (data: AxiosResponse<GetDatabasesCurrentResponse>) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
};

/**
 * Simple custom hook to fetch current database infos.
 */
export const useGetDatabaseCurrent = ({
	onSuccess,
	onError,
	onFinally,
	executeImmediately = false
}: GetDatabasesParameters) => {
	return useApiHook<AxiosResponse<GetDatabasesCurrentResponse>>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		fetchFunction: getDatabaseCurrent
	});
};
