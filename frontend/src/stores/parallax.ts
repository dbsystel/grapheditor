import { ParallaxData, ParallaxFilters, ParallaxInitialQuery } from 'src/models/parallax';
import { create } from 'zustand';

export type ParallaxHistory = {
	filters: ParallaxFilters;
	incomingRelationTypes: string[];
	outgoingRelationTypes: string[];
};

/**
 * Parallax store containing parallax query results and API for managing
 * the parallax-specific state. Similar pattern to items store but
 * specialized for parallax functionality.
 */
type ParallaxStore = {
	// Main parallax data storage
	parallaxData: ParallaxData | null;
	initialQuery: ParallaxInitialQuery;
	history: Array<ParallaxHistory>;
	currentHistoryIndex: number;
	isLoading: boolean;
	// Core data management API (similar to items store pattern)
	setParallaxData: (data: ParallaxData) => void;
	clearParallaxData: () => void;
	setHistory: (historyEntries: Array<ParallaxHistory>) => void;
	setInitialQuery: (initialQuery: ParallaxInitialQuery) => void;
	setCurrentHistoryIndex: (currentHistoryIndex: number) => void;
	setIsLoading: (loading: boolean) => void;

	reset: () => void;
};

type InitialParallaxState = Omit<
	ParallaxStore,
	| 'setParallaxData'
	| 'clearParallaxData'
	| 'setHistory'
	| 'setIsLoading'
	| 'reset'
	| 'setCurrentHistoryIndex'
	| 'setInitialQuery'
>;

const getInitialParallaxState = (): InitialParallaxState => ({
	parallaxData: null,
	initialQuery: {
		nodeIds: [],
		filters: {
			labels: [],
			properties: {}
		}
	},
	isLoading: false,
	history: [],
	currentHistoryIndex: -1 // -1 means no history entry is selected
});

export const useParallaxStore = create<ParallaxStore>((set) => ({
	...getInitialParallaxState(),

	// Core data management (following items store pattern)
	setParallaxData: (data) => {
		set({ parallaxData: data });
	},
	clearParallaxData: () => {
		set({
			parallaxData: null
		});
	},
	setHistory: (historyEntries) => {
		set({
			history: historyEntries
		});
	},
	setCurrentHistoryIndex: (currentHistoryIndex) => {
		set({
			currentHistoryIndex: currentHistoryIndex
		});
	},
	setInitialQuery: (initialQuery) => {
		set({
			initialQuery: initialQuery
		});
	},
	setIsLoading: (loading) => set({ isLoading: loading }),
	reset: () => {
		set(getInitialParallaxState());
	}
}));

// Debug access (following items store pattern)
(window as any).useParallaxStore = useParallaxStore;
