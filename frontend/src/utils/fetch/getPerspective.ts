import { Perspective, PerspectiveId } from 'src/models/perspective';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type GetPerspectiveParameters = {
	perspectiveId: PerspectiveId;
};
export type GetPerspectiveResponse = Perspective;

export const getPerspective = ({ perspectiveId }: GetPerspectiveParameters) => {
	return backendApi.get<GetPerspectiveResponse>(
		endpoints.getPerspectivePath({ perspectiveId: perspectiveId })
	);
};
