import { AxiosError, AxiosResponse } from 'axios';
import { patchNode, PatchNodeParameters, PatchNodeResponse } from 'src/utils/fetch/patchNode';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type UsePatchNodeParameters = {
	onSuccess: (data: AxiosResponse<PatchNodeResponse>) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
} & PatchNodeParameters;

/**
 * Simple custom hook to patch a specific Node.
 */
export const usePatchNode = ({
	nodeId,
	labels,
	properties,
	onSuccess,
	onError,
	onFinally,
	executeImmediately
}: UsePatchNodeParameters) => {
	return useApiHook<AxiosResponse<PatchNodeResponse>, PatchNodeParameters>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		fetchFunction: (parameters?: PatchNodeParameters) => {
			const params =
				typeof parameters === 'undefined'
					? { nodeId: nodeId, labels: labels, properties: properties }
					: {
							nodeId: parameters.nodeId,
							labels: parameters.labels,
							properties: parameters.properties
						};

			return patchNode(params);
		}
	});
};
