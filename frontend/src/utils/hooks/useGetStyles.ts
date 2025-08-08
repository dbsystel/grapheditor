import { AxiosError, AxiosResponse } from 'axios';
import { getStyles, GetStylesResponse } from 'src/utils/fetch/getStyles';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type GetStylesParameters = {
	onSuccess: (data: AxiosResponse<GetStylesResponse>) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
	waitBeforeReFetch?: boolean;
};

/**
 * Simple custom hook to currently active graph styles.
 */
export const useGetStyles = ({
	onSuccess,
	onError,
	onFinally,
	executeImmediately = false,
	waitBeforeReFetch = false
}: GetStylesParameters) => {
	return useApiHook<AxiosResponse<GetStylesResponse>>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		waitBeforeReFetch: waitBeforeReFetch,
		fetchFunction: getStyles
	});
};
