import { getBuildInfoBackend } from 'src/utils/fetch/getBuildInfoBackend';
import { getBuildInfoFrontend } from 'src/utils/fetch/getBuildInfoFrontend';

export const buildApi = {
	fetch: {
		getBuildInfoBackend: getBuildInfoBackend,
		getBuildInfoFrontend: getBuildInfoFrontend
	}
};
