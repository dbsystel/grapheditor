import { NodeId } from 'src/models/node';
import { ParaQuery } from 'src/models/paraquery';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type GetParaQueriesResponse = {
	paraqueries: Record<NodeId, ParaQuery>;
};

export const getParaQueries = () => {
	return backendApi.get<GetParaQueriesResponse>(endpoints.getParaQueriesPath());
};
