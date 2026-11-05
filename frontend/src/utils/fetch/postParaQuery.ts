import { NodeId } from 'src/models/node';
import { ParaQuery, ParaQueryParameterValues } from 'src/models/paraquery';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type PostParaQueryResponse = {
	paraquery: ParaQuery;
};

export type PostParaQueryParameters = {
	paraQueryId: NodeId;
	parameters?: ParaQueryParameterValues;
};

export const postParaQuery = ({ paraQueryId, parameters }: PostParaQueryParameters) => {
	return backendApi.post<PostParaQueryResponse>(
		endpoints.getParaQueryPath({ paraQueryId: paraQueryId }),
		{
			parameters: parameters
		}
	);
};
