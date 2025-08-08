import { AxiosResponse } from 'axios';
import { NodePositions, Perspective } from 'src/models/perspective';
import { RelationId } from 'src/models/relation';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type PostPerspectiveParameters = {
	name: string;
	nodePositions: NodePositions;
	relationIds: Array<RelationId>;
};
type PostPerspectiveServerParameters = Pick<PostPerspectiveParameters, 'name'> & {
	node_positions: PostPerspectiveParameters['nodePositions'];
	relation_ids: PostPerspectiveParameters['relationIds'];
};
export type PostPerspectiveResponse = Perspective;

export const postPerspective = ({
	name,
	nodePositions,
	relationIds
}: PostPerspectiveParameters) => {
	return backendApi.post<
		PostPerspectiveResponse,
		AxiosResponse<PostPerspectiveResponse>,
		PostPerspectiveServerParameters
	>(endpoints.getPerspectivesPath(), {
		name: name,
		node_positions: nodePositions,
		relation_ids: relationIds
	});
};
