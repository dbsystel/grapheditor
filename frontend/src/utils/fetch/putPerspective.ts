import { AxiosResponse } from 'axios';
import { NodePositions, Perspective } from 'src/models/perspective';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type PutPerspectiveParameters = {
	perspectiveId: string;
	perspectiveName: string;
	nodePositions: NodePositions;
	relationIds: Array<string>;
};
type PutPerspectiveServerParameters = {
	name: PutPerspectiveParameters['perspectiveName'];
	node_positions: PutPerspectiveParameters['nodePositions'];
	relation_ids: PutPerspectiveParameters['relationIds'];
};
export type PutPerspectiveResponse = Perspective;

export const putPerspective = ({
	perspectiveId,
	nodePositions,
	perspectiveName,
	relationIds
}: PutPerspectiveParameters) => {
	return backendApi.put<
		PutPerspectiveResponse,
		AxiosResponse<PutPerspectiveResponse>,
		PutPerspectiveServerParameters
	>(endpoints.getPerspectivePath({ perspectiveId: perspectiveId }), {
		name: perspectiveName,
		node_positions: nodePositions,
		relation_ids: relationIds
	});
};
