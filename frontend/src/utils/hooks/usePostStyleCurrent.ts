import { AxiosError, AxiosResponse } from 'axios';
import {
	postStyleCurrent,
	PostStyleCurrentParameters,
	PostStyleCurrentResponse
} from 'src/utils/fetch/postStyleCurrent';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type UsePostStyleCurrentParameters = {
	onSuccess: (data: AxiosResponse<PostStyleCurrentResponse>) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
} & PostStyleCurrentParameters;

/**
 * Simple custom hook to set a style (.grass) file.
 */
export const usePostStyleCurrent = (
	{
		onSuccess,
		onError,
		onFinally,
		executeImmediately = false,
		filename
	}: UsePostStyleCurrentParameters,
	dependencies?: Array<unknown>
) => {
	return useApiHook<AxiosResponse<PostStyleCurrentResponse>, PostStyleCurrentParameters>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		dependencies: dependencies,
		fetchFunction: (parameters?: PostStyleCurrentParameters) => {
			return postStyleCurrent({ filename: parameters?.filename || filename });
		}
	});
};
