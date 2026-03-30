import { AxiosError, AxiosResponse } from 'axios';
import { api } from 'src/utils/api/api';
import { GetRelationsDefaultTypeNodesResponse } from 'src/utils/fetch/getRelationsDefaultTypeNodes';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type GetRelationsTypeDefaultNodeParameters = {
	onSuccess: (data: AxiosResponse<GetRelationsDefaultTypeNodesResponse>) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
};

/**
 * Simple custom hook to fetch relations default type node.
 */
export const useGetRelationsDefaultTypeNode = ({
	onSuccess,
	onError,
	onFinally,
	executeImmediately
}: GetRelationsTypeDefaultNodeParameters) => {
	return useApiHook<AxiosResponse<GetRelationsDefaultTypeNodesResponse>>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		fetchFunction: api.relations.fetch.getRelationsDefaultTypeNodes
	});
};
