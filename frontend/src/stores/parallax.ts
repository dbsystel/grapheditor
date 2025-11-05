import { ParallaxData, ParallaxFilters, ParallaxInitialQuery } from 'src/models/parallax';
import { create } from 'zustand';

export type ParallaxHistory = {
	filters: ParallaxFilters;
	incomingRelationTypes: string[];
	outgoingRelationTypes: string[];
};

/**
 * We observe nodes changes, and since those changes can occur basically anywhere in the app,
 * we need something to differentiate when parallax should be reset, when breadcrumbs should be
 * updated and so on.
 * Small note: when working with node and relation changes (add/update/remove) at the same time, and
 * if both those changes are stored on the server, only nodes should trigger new render since the server
 * now contains data about relations.
 */
type ParallaxStoreApiTriggerType =
	| 'initial' // search/perspective executed, start the parallax (breadcrumbs start from the beginning and so on)
	| 'filters' // filters executed (new filters applied, update breadcrumbs and so on)
	| 'next-steps' // next steps executed (add new breadcrumb and so on)
	| 'breadcrumbs' // breadcrumbs executed (user selected manually another breadcrumb)
	| 'refresh' // general store nodes updates, can happen from anywhere (take the existing data but use new node IDs)
	| 'none'; // chill, relax, a.k.a do nothing

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
	apiTriggerType: ParallaxStoreApiTriggerType;
	shouldPreventApiCall: boolean;
	// Core data management API (similar to items store pattern)
	setParallaxData: (data: ParallaxData) => void;
	clearParallaxData: () => void;
	setHistory: (historyEntries: Array<ParallaxHistory>) => void;
	setInitialQuery: (initialQuery: ParallaxInitialQuery) => void;
	setCurrentHistoryIndex: (currentHistoryIndex: number) => void;
	setIsLoading: (isLoading: boolean) => void;
	setApiTriggerType: (newType: ParallaxStoreApiTriggerType) => void;
	setShouldPreventApiCall: (shouldPreventApiCall: boolean) => void;
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
	| 'setApiTriggerType'
	| 'setShouldPreventApiCall'
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
	currentHistoryIndex: -1, // -1 means no history entry is selected,
	apiTriggerType: 'refresh',
	shouldPreventApiCall: false
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
	setIsLoading: (isLoading) => {
		set({ isLoading: isLoading });
	},
	setApiTriggerType: (newApiTriggerType) => {
		set({ apiTriggerType: newApiTriggerType });
	},
	setShouldPreventApiCall: (shouldPreventApiCall) => {
		set({ shouldPreventApiCall: shouldPreventApiCall });
	},
	reset: () => {
		set(getInitialParallaxState());
	}
}));

// Debug access (following items store pattern)
(window as any).useParallaxStore = useParallaxStore;
