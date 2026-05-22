import { Database } from 'src/models/database';
import { create } from 'zustand';

type DatabaseStore = {
	currentDatabase: Database | null;
	setCurrentDatabase: (database: Database) => void;
	isLoading: boolean;
	setIsLoading: (isLoading: boolean) => void;
	reset: () => void;
};

type InitialState = Omit<DatabaseStore, 'setCurrentDatabase' | 'setIsLoading' | 'reset'>;

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
	}
}));
