import { AxiosError, AxiosResponse } from 'axios';
import {
	postDatabaseCurrent,
	PostDatabaseCurrentParameters,
	PostDatabaseCurrentResponse
} from 'src/utils/fetch/postDatabaseCurrent';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type UsePostDatabaseCurrentParameters = {
	onSuccess: (data: AxiosResponse<PostDatabaseCurrentResponse>) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
} & PostDatabaseCurrentParameters;

/**
 * Simple custom hook to store user's currently used database.
 */
export const usePostDatabaseCurrent = ({
	onSuccess,
	onError,
	onFinally,
	executeImmediately = false,
	name
}: UsePostDatabaseCurrentParameters) => {
	return useApiHook<AxiosResponse<PostDatabaseCurrentResponse>, PostDatabaseCurrentParameters>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		fetchFunction: (parameters?: PostDatabaseCurrentParameters) => {
			return postDatabaseCurrent({ name: parameters?.name || name });
		}
	});
};
