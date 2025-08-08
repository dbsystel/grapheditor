import { AxiosError } from 'axios';
import {
	getNodesLabelsNodes,
	GetNodesLabelsNodesResponse
} from 'src/utils/fetch/getNodesLabelsNodes';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type GetNodesLabelsNodesParameters = {
	onSuccess: (data: GetNodesLabelsNodesResponse) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
};

/**
 * Simple custom hook to fetch labels nodes from all Nodes.
 */
export const useGetNodesLabelsNodes = ({
	onSuccess,
	onError,
	onFinally,
	executeImmediately
}: GetNodesLabelsNodesParameters) => {
	return useApiHook<GetNodesLabelsNodesResponse>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		fetchFunction: getNodesLabelsNodes
	});
};
