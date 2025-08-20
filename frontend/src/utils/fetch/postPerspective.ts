import { AxiosResponse } from 'axios';
import { NodePositions, Perspective } from 'src/models/perspective';
import { RelationId } from 'src/models/relation';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type PostPerspectiveParameters = {
	name: string;
	description: string;
	nodePositions: NodePositions;
	relationIds: Array<RelationId>;
};
type PostPerspectiveServerParameters = Pick<PostPerspectiveParameters, 'name' | 'description'> & {
	node_positions: PostPerspectiveParameters['nodePositions'];
	relation_ids: PostPerspectiveParameters['relationIds'];
};
export type PostPerspectiveResponse = Perspective;

export const postPerspective = ({
	name,
	description,
	nodePositions,
	relationIds
}: PostPerspectiveParameters) => {
	return backendApi.post<
		PostPerspectiveResponse,
		AxiosResponse<PostPerspectiveResponse>,
		PostPerspectiveServerParameters
	>(endpoints.getPerspectivesPath(), {
		name: name,
		description: description,
		node_positions: nodePositions,
		relation_ids: relationIds
	});
};
