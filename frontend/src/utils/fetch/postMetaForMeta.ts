import { AxiosResponse } from 'axios';
import { MetaForMeta, NodeId } from 'src/models/node';
import { backendApi } from 'src/utils/api';
import { GraphEditorType } from 'src/utils/constants';
import { endpoints } from 'src/utils/endpoints';

export type MetaForMetaParameters = {
	ids: Array<NodeId>;
	resultType:
		| typeof GraphEditorType.META_PROPERTY
		| typeof GraphEditorType.META_RELATION
		| typeof GraphEditorType.META_LABEL;
};
type MetaForMetaServerParameters = {
	ids: MetaForMetaParameters['ids'];
	result_type: MetaForMetaParameters['resultType'];
};

export type MetaForMetaResponse = {
	nodes: MetaForMeta;
};

export const postMetaForMeta = ({ ids, resultType }: MetaForMetaParameters) => {
	return backendApi.post<
		MetaForMetaResponse,
		AxiosResponse<MetaForMetaResponse>,
		MetaForMetaServerParameters
	>(endpoints.getMetaForMetaPath(), {
		ids: ids,
		result_type: resultType
	});
};
