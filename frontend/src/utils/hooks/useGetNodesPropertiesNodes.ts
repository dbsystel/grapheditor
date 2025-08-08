import { AxiosError } from 'axios';
import {
	getNodesPropertiesNodes,
	GetNodesPropertiesNodesResponse
} from 'src/utils/fetch/getNodesPropertiesNodes';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type GetNodesPropertiesNodesParameters = {
	onSuccess: (data: GetNodesPropertiesNodesResponse) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
};

/**
 * Simple custom hook to fetch properties nodes from all Nodes.
 */
export const useGetNodesPropertiesNodes = ({
	onSuccess,
	onError,
	onFinally,
	executeImmediately
}: GetNodesPropertiesNodesParameters) => {
	return useApiHook<GetNodesPropertiesNodesResponse>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		fetchFunction: getNodesPropertiesNodes
	});
};
