import { AxiosError, AxiosResponse } from 'axios';
import { getNode, GetNodeParameters, GetNodeResponse } from 'src/utils/fetch/getNode';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type UseGetNodeParameters = {
	onSuccess: (data: AxiosResponse<GetNodeResponse>) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
} & GetNodeParameters;

/**
 * Simple custom hook to fetch a specific Node.
 */
export const useGetNode = ({
	nodeId,
	onSuccess,
	onError,
	onFinally,
	executeImmediately = true
}: UseGetNodeParameters) => {
	return useApiHook<AxiosResponse<GetNodeResponse>, GetNodeParameters>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		fetchFunction: (parameters?: GetNodeParameters) =>
			getNode({ nodeId: parameters?.nodeId || nodeId })
	});
};
