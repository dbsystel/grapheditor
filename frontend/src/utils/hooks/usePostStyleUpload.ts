import { AxiosError, AxiosResponse } from 'axios';
import {
	postStyleUpload,
	PostStyleUploadParameters,
	PostStyleUploadResponse
} from 'src/utils/fetch/postStyleUpload';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type UsePostStyleUploadParameters = {
	onSuccess: (data: AxiosResponse<PostStyleUploadResponse>) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
} & PostStyleUploadParameters;

/**
 * Simple custom hook to post a style (.grass) file.
 */
export const usePostStyleUpload = (
	{
		onSuccess,
		onError,
		onFinally,
		executeImmediately = false,
		file
	}: UsePostStyleUploadParameters,
	dependencies?: Array<unknown>
) => {
	return useApiHook<AxiosResponse<PostStyleUploadResponse>, PostStyleUploadParameters>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		dependencies: dependencies,
		fetchFunction: (parameters?: PostStyleUploadParameters) => {
			return postStyleUpload({ file: parameters?.file || file });
		}
	});
};
