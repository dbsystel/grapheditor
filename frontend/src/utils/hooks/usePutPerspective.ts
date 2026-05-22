import { AxiosError, AxiosResponse } from 'axios';
import { api } from 'src/utils/api/api';
import { PutPerspectiveParameters, PutPerspectiveResponse } from 'src/utils/fetch/putPerspective';
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
	perspectiveDescription,
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
							perspectiveDescription: perspectiveDescription,
							nodePositions: nodePositions,
							relationIds: relationIds
						}
					: {
							perspectiveId: parameters.perspectiveId,
							perspectiveName: parameters.perspectiveName,
							perspectiveDescription: parameters.perspectiveDescription,
							nodePositions: parameters.nodePositions,
							relationIds: parameters.relationIds
						};

			return api.perspectives.fetch.putPerspective(params);
		}
	});
};
