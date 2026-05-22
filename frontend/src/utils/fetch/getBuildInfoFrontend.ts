import { frontendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type GetBuildInfoFrontendResponse = {
	timestamp: string;
	commit: string;
};

export const getBuildInfoFrontend = () => {
	return frontendApi.get<GetBuildInfoFrontendResponse>(endpoints.getBuildFrontendInfoPath());
};
