import { AxiosError } from 'axios';
import {
	getNodesPerspectivesNodes,
	GetNodesPerspectivesNodesResponse
} from 'src/utils/fetch/getNodesPerspectivesNodes';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type GetNodesPerspectivesNodesParameters = {
	onSuccess: (data: GetNodesPerspectivesNodesResponse) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
};

/**
 * Simple custom hook to fetch perspective nodes from all Nodes.
 */
export const useGetNodesPerspectivesNodes = ({
	onSuccess,
	onError,
	onFinally,
	executeImmediately
}: GetNodesPerspectivesNodesParameters) => {
	return useApiHook<GetNodesPerspectivesNodesResponse>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		fetchFunction: getNodesPerspectivesNodes
	});
};
