import { AxiosError, AxiosResponse } from 'axios';
import {
	putPerspective,
	PutPerspectiveParameters,
	PutPerspectiveResponse
} from 'src/utils/fetch/putPerspective';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type UsePutPerspectiveParameters = {
	onSuccess: (data: AxiosResponse<PutPerspectiveResponse>) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
} & PutPerspectiveParameters;

/**
 * Simple custom hook to create a Perspective.
 */
export const usePutPerspective = ({
	perspectiveId,
	perspectiveName,
	nodePositions,
	relationIds,
	onSuccess,
	onError,
	onFinally,
	executeImmediately = false
}: UsePutPerspectiveParameters) => {
	return useApiHook<AxiosResponse<PutPerspectiveResponse>, PutPerspectiveParameters>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		fetchFunction: (parameters?: PutPerspectiveParameters) => {
			const params =
				typeof parameters === 'undefined'
					? {
							perspectiveId: perspectiveId,
							perspectiveName: perspectiveName,
							nodePositions: nodePositions,
							relationIds: relationIds
						}
					: {
							perspectiveId: parameters.perspectiveId,
							perspectiveName: parameters.perspectiveName,
							nodePositions: parameters.nodePositions,
							relationIds: parameters.relationIds
						};

			return putPerspective(params);
		}
	});
};
