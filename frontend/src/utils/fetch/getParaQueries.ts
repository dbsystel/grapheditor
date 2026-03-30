import { NodeId } from 'src/models/node';
import { ParaQuery } from 'src/models/paraquery';
import { backendApi } from 'src/utils/backend-api';
import { endpoints } from 'src/utils/endpoints';

export type GetParaQueriesResponse = {
	paraqueries: Array<[NodeId, ParaQuery['description']]>;
};

export const getParaQueries = () => {
	return backendApi.get<GetParaQueriesResponse>(endpoints.getParaQueriesPath());
};
