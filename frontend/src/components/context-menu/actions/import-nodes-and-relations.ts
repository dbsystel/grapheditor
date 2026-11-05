import { useContextMenuStore } from 'src/stores/context-menu';
import { useImportExportStore } from 'src/stores/import-export';

export const importNodesAndRelationsAction = () => {
	useImportExportStore.getState().openImportModal();
	useContextMenuStore.getState().close();
};
