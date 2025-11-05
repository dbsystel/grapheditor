import { AxiosError, AxiosResponse } from 'axios';
import {
	deleteStyle,
	DeleteStyleParameters,
	DeleteStyleResponse
} from 'src/utils/fetch/deleteStyle';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type UseDeleteStyleParameters = {
	onSuccess: (data: AxiosResponse<DeleteStyleResponse>) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
} & DeleteStyleParameters;

/**
 * Simple custom hook to fetch a specific Style.
 */
export const useDeleteStyle = ({
	grassFileName,
	onSuccess,
	onError,
	onFinally,
	executeImmediately = false
}: UseDeleteStyleParameters) => {
	return useApiHook<AxiosResponse<DeleteStyleResponse>, DeleteStyleParameters>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		fetchFunction: (parameters?: DeleteStyleParameters) =>
			deleteStyle({ grassFileName: parameters?.grassFileName || grassFileName })
	});
};
