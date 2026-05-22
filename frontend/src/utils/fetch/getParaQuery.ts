import { NodeId } from 'src/models/node';
import { ParaQuery } from 'src/models/paraquery';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type GetParaQueryResponse = {
	paraquery: ParaQuery;
};

export type GetParaQueryParameters = { paraQueryId: NodeId };

export const getParaQuery = ({ paraQueryId }: GetParaQueryParameters) => {
	return backendApi.get<GetParaQueryResponse>(
		endpoints.getParaQueryPath({ paraQueryId: paraQueryId })
	);
};
