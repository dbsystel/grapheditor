import { AxiosResponse } from 'axios';
import { NodeId } from 'src/models/node';
import { ParallaxData, ParallaxFilters, ParallaxSteps } from 'src/models/parallax';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type PostParallaxParameters = {
	nodeIds: Array<NodeId>;
	filters: ParallaxFilters;
	steps: ParallaxSteps;
};

export type PostParallaxResponse = ParallaxData;

export const postParallax = (parameters: PostParallaxParameters) => {
	return backendApi.post<
		PostParallaxResponse,
		AxiosResponse<PostParallaxResponse>,
		PostParallaxParameters
	>(endpoints.getParallaxPath(), parameters);
};
