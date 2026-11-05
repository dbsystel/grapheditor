import { Database } from 'src/models/database';
import { create } from 'zustand';

type DatabaseStore = {
	currentDatabase: Database | null;
	setCurrentDatabase: (database: Database) => void;
	isLoading: boolean;
	setIsLoading: (isLoading: boolean) => void;
	reset: () => void;
	databaseSupportsPerspectives: (database: Database) => boolean;
	databaseSupportsTriggers: (database: Database) => boolean;
	databaseSupportsFunctions: (database: Database) => boolean;
};

type InitialState = Omit<
	DatabaseStore,
	| 'setCurrentDatabase'
	| 'setIsLoading'
	| 'reset'
	| 'databaseSupportsPerspectives'
	| 'databaseSupportsTriggers'
	| 'databaseSupportsFunctions'
>;

const getInitialState: () => InitialState = () => {
	return {
		currentDatabase: null,
		isLoading: false
	};
};

/**
 * General database store.
 */
export const useDatabaseStore = create<DatabaseStore>((set) => ({
	...getInitialState(),
	setCurrentDatabase: (database) => {
		set({ currentDatabase: database });
	},
	setIsLoading: (isLoading) => {
		set({ isLoading: isLoading });
	},
	reset: () => {
		set(getInitialState());
	},
	databaseSupportsPerspectives: (database) => {
		return !!database.features?.includes('Perspectives');
	},
	databaseSupportsTriggers: (database) => {
		return !!database.features?.includes('GraphEditorTriggers');
	},
	databaseSupportsFunctions: (database) => {
		return !!database.features?.includes('GraphEditorFunctions');
	}
}));
