import { NodeId } from 'src/models/node';
import { RelationId } from 'src/models/relation';

export type ExportNodeMode = 'all_loaded' | 'all_selected' | 'cypher';
export type ExportRelationMode = 'none' | 'between_selected_nodes' | 'between_exported_nodes';
export type ExportConfiguration =
	| {
			mode: 'cypher';
			cypher: string;
	  }
	| {
			mode: 'explicit';
			selection: {
				nodes: { mode: 'all' } | { mode: 'ids'; ids: Array<NodeId> };
				edges:
					| { mode: 'none' }
					| { mode: 'between_exported' }
					| { mode: 'ids'; ids: Array<RelationId> };
			};
	  };

export type ImportStrategy = 'create_new' | 'overwrite';
export type ImportExportModalType = 'import' | 'export';
