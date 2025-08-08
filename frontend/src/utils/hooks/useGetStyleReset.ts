import { AxiosError, AxiosResponse } from 'axios';
import { getStyleReset, GetStyleResetResponse } from 'src/utils/fetch/getStyleReset';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type GetStyleReset = {
	onSuccess: (data: AxiosResponse<GetStyleResetResponse>) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
};

/**
 * Simple custom hook to reset graph styles.
 */
export const useGetStyleReset = ({
	onSuccess,
	onError,
	onFinally,
	executeImmediately = false
}: GetStyleReset) => {
	return useApiHook<AxiosResponse<GetStyleResetResponse>>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		fetchFunction: getStyleReset
	});
};
