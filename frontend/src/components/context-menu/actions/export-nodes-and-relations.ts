import { useContextMenuStore } from 'src/stores/context-menu';
import {
	ImportExportStoreOpenExportModalOptions,
	useImportExportStore
} from 'src/stores/import-export';

export const exportNodesAndRelationsAction = (options: ImportExportStoreOpenExportModalOptions) => {
	useContextMenuStore.getState().close();

	useImportExportStore.getState().openExportModal({
		defaultNodeMode: options.defaultNodeMode,
		defaultRelationMode: options.defaultRelationMode,
		defaultCypherQuery: options.defaultCypherQuery
	});
};
