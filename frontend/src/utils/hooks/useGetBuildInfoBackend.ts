import { AxiosError, AxiosResponse } from 'axios';
import { api } from 'src/utils/api/api';
import { GetBuildInfoBackendResponse } from 'src/utils/fetch/getBuildInfoBackend';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type GetBuildInfoBackendParameters = {
	onSuccess?: (data: AxiosResponse<GetBuildInfoBackendResponse>) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
};

export const useGetBuildInfoBackend = ({
	onSuccess,
	onError,
	onFinally,
	executeImmediately = true
}: GetBuildInfoBackendParameters = {}) => {
	return useApiHook<AxiosResponse<GetBuildInfoBackendResponse>>({
		executeImmediately,
		onSuccess,
		onError,
		onFinally,
		fetchFunction: api.buildInfoBackend.fetch.getBuildInfoBackend
	});
};
