import { AxiosError, AxiosResponse } from 'axios';
import { parallaxApi } from 'src/utils/api/parallax';
import { PostParallaxParameters, PostParallaxResponse } from 'src/utils/fetch/postParallax';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type UsePostParallaxParameters = {
	onSuccess: (data: AxiosResponse<PostParallaxResponse>) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
} & PostParallaxParameters;

/**
 * Custom hook to execute Parallax queries.
 */
export const usePostParallax = ({
	onSuccess,
	onError,
	onFinally,
	executeImmediately = false,
	nodeIds,
	filters,
	steps
}: UsePostParallaxParameters) => {
	return useApiHook<AxiosResponse<PostParallaxResponse>, PostParallaxParameters>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		fetchFunction: (parameters?: PostParallaxParameters) => {
			const params =
				typeof parameters === 'undefined'
					? {
							nodeIds: nodeIds,
							filters: filters,
							steps: steps
						}
					: {
							nodeIds: parameters.nodeIds,
							filters: parameters.filters,
							steps: parameters.steps
						};

			return parallaxApi.postParallax(params);
		}
	});
};
