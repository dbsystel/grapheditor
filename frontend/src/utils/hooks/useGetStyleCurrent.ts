import { AxiosError, AxiosResponse } from 'axios';
import { getStyleCurrent, GetStyleCurrentResponse } from 'src/utils/fetch/getStyleCurrent';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type GetStyleCurrent = {
	onSuccess: (data: AxiosResponse<GetStyleCurrentResponse>) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
	waitBeforeReFetch?: boolean;
};

/**
 * Simple custom hook to currently active graph style.
 */
export const useGetStyleCurrent = ({
	onSuccess,
	onError,
	onFinally,
	executeImmediately = false,
	waitBeforeReFetch = false
}: GetStyleCurrent) => {
	return useApiHook<AxiosResponse<GetStyleCurrentResponse>>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		waitBeforeReFetch: waitBeforeReFetch,
		fetchFunction: getStyleCurrent
	});
};
