import { AxiosError, AxiosResponse } from 'axios';
import { api } from 'src/utils/api/api';
import { GetBuildInfoFrontendResponse } from 'src/utils/fetch/getBuildInfoFrontend';
import { useApiHook } from 'src/utils/hooks/useApiHook';

export type GetBuildInfoFrontendParameters = {
	onSuccess?: (data: AxiosResponse<GetBuildInfoFrontendResponse>) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
};

export const useGetBuildInfoFrontend = ({
	onSuccess,
	onError,
	onFinally,
	executeImmediately = true
}: GetBuildInfoFrontendParameters) => {
	return useApiHook<AxiosResponse<GetBuildInfoFrontendResponse>>({
		executeImmediately,
		onSuccess,
		onError,
		onFinally,
		fetchFunction: api.buildInfoFrontend.fetch.getBuildInfoFrontend
	});
};
