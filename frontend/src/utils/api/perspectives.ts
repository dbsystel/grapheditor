import { getPerspective } from 'src/utils/fetch/getPerspective';
import { postPerspective } from 'src/utils/fetch/postPerspective';
import { putPerspective } from 'src/utils/fetch/putPerspective';

export const perspectivesApi = {
	fetch: {
		getPerspective: getPerspective,
		postPerspective: postPerspective,
		putPerspective: putPerspective
	}
};
