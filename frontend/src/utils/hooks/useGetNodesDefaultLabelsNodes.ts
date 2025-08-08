import { AxiosError, AxiosResponse } from 'axios';
import {
	getNodesDefaultLabelNodes,
	GetNodesDefaultLabelNodesResponse
} from 'src/utils/fetch/getNodesDefaultLabelNodes';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type GetNodesLabelsDefaultNodesParameters = {
	onSuccess: (data: AxiosResponse<GetNodesDefaultLabelNodesResponse>) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
};

/**
 * Simple custom hook to fetch nodes default labels nodes.
 */
export const useGetNodesDefaultLabelsNodes = ({
	onSuccess,
	onError,
	onFinally,
	executeImmediately
}: GetNodesLabelsDefaultNodesParameters) => {
	return useApiHook<AxiosResponse<GetNodesDefaultLabelNodesResponse>>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		fetchFunction: getNodesDefaultLabelNodes
	});
};
