import { AxiosError, AxiosResponse } from 'axios';
import {
	postPerspective,
	PostPerspectiveParameters,
	PostPerspectiveResponse
} from 'src/utils/fetch/postPerspective';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type UsePostPerspectiveParameters = {
	onSuccess: (data: AxiosResponse<PostPerspectiveResponse>) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
} & PostPerspectiveParameters;

/**
 * Simple custom hook to create a Perspective.
 */
export const usePostPerspective = ({
	onSuccess,
	onError,
	onFinally,
	executeImmediately = false,
	name,
	description,
	nodePositions,
	relationIds
}: UsePostPerspectiveParameters) => {
	return useApiHook<AxiosResponse<PostPerspectiveResponse>, PostPerspectiveParameters>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		fetchFunction: (parameters?: PostPerspectiveParameters) => {
			const params =
				typeof parameters === 'undefined'
					? {
							name: name,
							description: description,
							nodePositions: nodePositions,
							relationIds: relationIds
						}
					: {
							name: parameters.name,
							description: parameters.description,
							nodePositions: parameters.nodePositions,
							relationIds: parameters.relationIds
						};

			return postPerspective(params);
		}
	});
};
