import { ExportFormFormData } from 'src/components/export-form/ExportForm.interfaces';
import { ExportConfiguration, ExportNodeMode, ExportRelationMode } from 'src/models/import-export';
import { NodeId } from 'src/models/node';
import { RelationId } from 'src/models/relation';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';

export const buildExportPayload = (options: {
	formData: ExportFormFormData;
	nodeIds: Array<NodeId>;
	relationIds: Array<RelationId>;
}): ExportConfiguration => {
	const { formData, nodeIds, relationIds } = options;

	if (formData.nodeMode === 'cypher') {
		return {
			mode: 'cypher',
			cypher: formData.cypherQuery
		};
	}

	return {
		mode: 'explicit',
		selection: {
			nodes: { mode: 'ids', ids: nodeIds },
			edges:
				formData.relationMode === 'between_selected_nodes'
					? { mode: 'ids', ids: relationIds }
					: formData.relationMode === 'between_exported_nodes'
						? { mode: 'between_exported' }
						: { mode: 'none' }
		}
	};
};

export const createJsonlBlob = (payload: BlobPart): Blob => {
	return new Blob([payload], {
		type: 'application/x-ndjson'
	});
};

export const getNodeAndRelationIdsToExport = (
	nodeMode: ExportNodeMode,
	relationMode: ExportRelationMode
) => {
	let nodeIds: Array<NodeId> = [];
	let relationIds: Array<RelationId> = [];

	// all nodes loaded in frontend
	if (nodeMode === 'all_loaded') {
		nodeIds = useItemsStore.getState().nodes.keys().toArray();
	}
	// highlighted nodes (note: hightlight can only happen in graph)
	else if (nodeMode === 'all_selected') {
		nodeIds = useGraphStore.getState().highlightedNodeIds.keys().toArray();
	}

	// all relations between selected nodes (frontend) or all relations between exported nodes (backend)
	if (relationMode === 'between_selected_nodes' || relationMode === 'between_exported_nodes') {
		const nodeIdSet = new Set(nodeIds);

		relationIds = useItemsStore
			.getState()
			.relations.values()
			.toArray()
			.filter((relation) => {
				return nodeIdSet.has(relation.source_id) && nodeIdSet.has(relation.target_id);
			})
			.map((relation) => relation.id);
	}

	return {
		nodeIds: nodeIds,
		relationIds: relationIds
	};
};
