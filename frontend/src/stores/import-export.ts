import {
	ExportNodeMode,
	ExportRelationMode,
	ImportExportModalType
} from 'src/models/import-export';
import { create } from 'zustand';

export type ImportExportStoreOpenExportModalOptions = {
	defaultNodeMode?: ExportNodeMode;
	defaultRelationMode?: ExportRelationMode;
	defaultCypherQuery?: string;
};

type ImportExportStore = {
	active: ImportExportModalType | null;
	defaultNodeMode: ExportNodeMode;
	defaultRelationMode: ExportRelationMode;
	defaultCypherQuery: string;
	openExportModal: (options?: ImportExportStoreOpenExportModalOptions) => void;
	openImportModal: () => void;
	close: () => void;
};

type InitialState = Omit<
	ImportExportStore,
	'openImportModal' | 'openExportModal' | 'close' | 'setDefaultNodeIds' | 'setDefaultRelationIds'
>;

const getInitialState: () => InitialState = () => {
	return {
		active: null,
		defaultNodeMode: 'all_loaded',
		defaultRelationMode: 'none',
		defaultCypherQuery: ''
	};
};

export const useImportExportStore = create<ImportExportStore>()((set) => ({
	...getInitialState(),
	openExportModal: (options) => {
		const defaultState = getInitialState();

		set({
			active: 'export',
			defaultNodeMode: options?.defaultNodeMode || defaultState.defaultNodeMode,
			defaultRelationMode: options?.defaultRelationMode || defaultState.defaultRelationMode,
			defaultCypherQuery: options?.defaultCypherQuery || defaultState.defaultCypherQuery
		});
	},
	openImportModal: () => {
		set({
			active: 'import'
		});
	},
	close: () => {
		set({ active: null });
	}
}));

(window as any).useImportExportStore = useImportExportStore;
