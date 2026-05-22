import { AxiosResponse } from 'axios';
import { NodeId } from 'src/models/node';
import { Relation, RelationType } from 'src/models/relation';
import { useItemsStore } from 'src/stores/items';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';
import { getItemDBId } from 'src/utils/helpers/items';

export type PostRelationsByNodeIdsResponse = Array<Relation>;

type PostRelationsByNodeIdsParameters = {
	additionalNodeIds?: Array<NodeId>;
	relationTypesToExclude?: Array<RelationType>;
};

type PostRelationsByNodeIdsServerParameters = {
	node_ids: Array<NodeId>;
	exclude_relation_types: Array<RelationType>;
};

export const postRelationsByNodeIds = ({
	additionalNodeIds,
	relationTypesToExclude
}: PostRelationsByNodeIdsParameters) => {
	const nonPseudoNodes = useItemsStore.getState().getStoreNonPseudoNodes();

	const uniqueNodeIds: Array<NodeId> = [
		...new Set([
			...nonPseudoNodes.map((node) => getItemDBId(node)),
			...(additionalNodeIds || [])
		])
	];

	return backendApi.post<
		PostRelationsByNodeIdsResponse,
		AxiosResponse<PostRelationsByNodeIdsResponse>,
		PostRelationsByNodeIdsServerParameters
	>(endpoints.getRelationsByNodeIds(), {
		node_ids: uniqueNodeIds,
		exclude_relation_types: relationTypesToExclude || []
	});
};
