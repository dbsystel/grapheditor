import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type GetBuildInfoBackendResponse = {
	timestamp: string;
	commit: string;
};

export const getBuildInfoBackend = () => {
	return backendApi.get<GetBuildInfoBackendResponse>(endpoints.getBuildBackendInfoPath());
};
