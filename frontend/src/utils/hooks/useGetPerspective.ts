import { AxiosError, AxiosResponse } from 'axios';
import {
	getPerspective,
	GetPerspectiveParameters,
	GetPerspectiveResponse
} from 'src/utils/fetch/getPerspective';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type UseGetPerspectiveParameters = {
	onSuccess: (data: AxiosResponse<GetPerspectiveResponse>) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
} & GetPerspectiveParameters;

/**
 * Simple custom hook to fetch a specific Perspective.
 */
export const useGetPerspective = (
	{
		perspectiveId,
		onSuccess,
		onError,
		onFinally,
		executeImmediately = false
	}: UseGetPerspectiveParameters,
	dependencies?: Array<unknown>
) => {
	return useApiHook<AxiosResponse<GetPerspectiveResponse>>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		dependencies: dependencies,
		fetchFunction: (parameters?: GetPerspectiveParameters) => {
			return getPerspective({ perspectiveId: parameters?.perspectiveId || perspectiveId });
		}
	});
};
