import { AxiosError } from 'axios';
import {
	getRelationsTypesNodes,
	GetRelationsTypesNodesResponse
} from 'src/utils/fetch/getRelationsTypesNodes';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type GetRelationsTypesNodesParameters = {
	onSuccess: (data: GetRelationsTypesNodesResponse) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
};

/**
 * Simple custom hook to fetch types nodes from all Relations.
 */
export const useGetRelationsTypesNodes = ({
	onSuccess,
	onError,
	onFinally
}: GetRelationsTypesNodesParameters) => {
	return useApiHook<GetRelationsTypesNodesResponse>({
		executeImmediately: true,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		fetchFunction: getRelationsTypesNodes
	});
};
