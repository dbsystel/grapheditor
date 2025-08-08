/**
 * Simple object containing methods to retrieve specific backend endpoints.
 * No reusable declarations such as "const version = '/v1'; ... return version + ..."
 * were used in order to improve readability.
 */

export const endpoints = {
	getDatabasesPath: () => {
		return '/v1/databases';
	},
	getDatabasesCurrentPath: () => {
		return '/v1/databases/current';
	},
	getLoginPath: () => {
		return '/v1/session/login';
	},
	getLogoutPath: () => {
		return '/v1/session/logout';
	},
	getNodesPath: (parameters?: { searchTerm?: string; labels?: Array<string> }) => {
		const searchTerm = parameters?.searchTerm || '';
		const labels = parameters?.labels || '';

		const queryParams: Array<string> = [];

		if (searchTerm) {
			queryParams.push(`text=${encodeURIComponent(searchTerm)}`);
		}

		if (Array.isArray(labels)) {
			labels.forEach((label) => queryParams.push(`labels=${encodeURIComponent(label)}`));
		}

		const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

		return `/v1/nodes${queryString}`;
	},
	getNodePath: ({ nodeId }: { nodeId: string }) => {
		return '/v1/nodes/' + encodeURIComponent(nodeId);
	},
	getNodesBulkDeletePath: () => {
		return '/v1/nodes/bulk_delete';
	},
	getNodeConnectionsPath: ({ nodeId }: { nodeId: string }) => {
		return `/v1/nodes/${encodeURIComponent(nodeId)}/relations`;
	},
	getNodesLabelsPath: () => {
		return '/v1/nodes/labels';
	},
	getNodesLabelsDefaultPath: () => {
		return '/v1/nodes/labels/default';
	},
	getNodesPropertiesPath: () => {
		return '/v1/nodes/properties';
	},
	getNodesBulkFetchPath: () => {
		return '/v1/nodes/bulk_fetch';
	},
	getPerspectivePath: ({ perspectiveId }: { perspectiveId: string }) => {
		return `/v1/perspectives/${perspectiveId}`;
	},
	getPerspectivesPath: () => {
		return '/v1/perspectives';
	},
	getRelationsPath: (parameters?: { searchTerm?: string }) => {
		const searchTerm = parameters?.searchTerm || '';

		return '/v1/relations' + (searchTerm ? '?text=' + searchTerm : '');
	},
	getRelationsTypesPath: () => {
		return '/v1/relations/types';
	},
	getRelationsTypesDefaultPath: () => {
		return '/v1/relations/types/default';
	},
	getRelationsPropertiesPath: () => {
		return '/v1/relations/properties';
	},
	getRelationPath: ({ relationId }: { relationId: string }) => {
		return '/v1/relations/' + relationId;
	},
	getRelationsByNodeIds: () => {
		return '/v1/relations/by_node_ids';
	},
	getRelationsBulkDeletePath: () => {
		return '/v1/relations/bulk_delete';
	},
	getGlobalSearchPath: () => {
		return '/v1/query/cypher';
	},
	getStyleUploadPath: () => {
		return '/v1/styles';
	},
	getStylesPath: () => {
		return '/v1/styles';
	},
	getStylePath: ({ grassFileName }: { grassFileName: string }) => {
		return '/v1/styles/' + grassFileName;
	},
	getStylesResetPath: () => {
		return '/v1/styles/reset';
	},
	getStylesCurrentPath: () => {
		return '/v1/styles/current';
	},
	getContextMenuActionsPath: () => {
		return '/v1/context-menu/actions';
	},
	getMetaForMetaPath: () => {
		return '/v1/meta/meta_for_meta';
	}
} as const;
