import { HomepageData } from 'src/models/general';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type GetHomepageDataResponse = HomepageData;

export const getHomepageData = () => {
	return backendApi.get<GetHomepageDataResponse>(endpoints.getHomepageDataPath());
};
