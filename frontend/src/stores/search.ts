import i18n from 'src/i18n';
import { CypherQuerySearchResult } from 'src/types/cypherQuerySearchResult';
import {
	APP_STORAGE_KEY_PREFIX,
	GLOBAL_SEARCH_ALGORITHM_KEY,
	GLOBAL_SEARCH_CYPHER_QUERY_DEFAULT_SEARCH_VALUE,
	GLOBAL_SEARCH_FULL_TEXT_DEFAULT_SEARCH_VALUE,
	GLOBAL_SEARCH_PARAMETER_KEY,
	GLOBAL_SEARCH_PRESENTATION_KEY,
	GLOBAL_SEARCH_TYPE_KEY,
	GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY,
	GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT,
	GLOBAL_SEARCH_TYPE_VALUE_PARA_QUERIES,
	GLOBAL_SEARCH_TYPE_VALUE_PARALLAX,
	GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVES,
	GRAPH_LAYOUT_FORCE_ATLAS_2,
	GRAPH_PRESENTATION_GRAPH
} from 'src/utils/constants';
import { clone, downloadFile } from 'src/utils/helpers/general';
import { create } from 'zustand';
import { createJSONStorage, persist, subscribeWithSelector } from 'zustand/middleware';

export type LayoutModuleType =
	| 'random'
	| 'force-atlas-2'
	| 'force'
	| 'noverlap'
	| 'perspective'
	| 'none';

export type SearchResultType =
	| typeof GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY
	| typeof GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT
	| typeof GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVES
	| typeof GLOBAL_SEARCH_TYPE_VALUE_PARALLAX
	| typeof GLOBAL_SEARCH_TYPE_VALUE_PARA_QUERIES
	| '';

export type SearchStoreResult = {
	data: CypherQuerySearchResult | null;
	type: SearchResultType;
};

// TODO remove "perspective" pieces of the store
type SearchStore = {
	type: SearchStoreType;
	query: string;
	cypherQueryParameters: Record<string, string>;
	key: string;
	presentation: string;
	algorithm: LayoutModuleType;
	style: string;
	result: SearchStoreResult;
	isResultProcessed: boolean;
	searchValue: string;
	newlyUploadedStyle: string;
	resetStyles: boolean;
	getUrlSearchParameter: (key: string) => ReturnType<URLSearchParams['get']>;
	getUrlSearchParameters: () => URLSearchParams;
	setType: (type: SearchStoreType) => void;
	setQuery: (query: string) => void;
	setCypherQueryParameters: (parameters: Record<string, string>) => void;
	setResult: (result: SearchStoreResult) => void;
	setIsResultProcessed: (processed: boolean) => void;
	setNewlyUploadedStyle: (style: string) => void;
	initialize: () => void;
	isLoading: boolean;
	setIsLoading: (value: boolean) => void;
	setPresentation: (presentation: string) => void;
	setAlgorithm: (algorithm: LayoutModuleType) => void;
	setStyle: (style: string) => void;
	setSearchValue: (searchValue: string) => void;
	getDefaultSearchValue: (type: SearchStoreSearchType) => string;
	setResetStyles: (value: boolean) => void;
	history: Record<SearchStoreSearchType, SearchStoreHistoryItem>;
	addHistoryEntry: (type: SearchStoreSearchType, value: string) => void;
	getSelectedHistory: () => SearchStoreHistoryItem | undefined;
	exportSelectedHistory: () => void;
	clearSelectedHistory: () => void;
	isSearchType: (type: unknown) => type is SearchStoreSearchType;
};

/**
 * Ideally, we would have the following type:
 *
 * export type SearchStoreHistoryItem = {
 * 	 entries: Array<string>;
 * 	 currentIndex: number;
 * };
 *
 * and manage both history entries and their index management, but due to the complexity of partially
 * persisting this type (a combination of "merge" and "partialize" from Zustand's store "persist" option
 * must be used in order to persist only the SearchStoreHistoryItem.entries property and still be able
 * to use the SearchStoreHistoryItem in store fully), we will persist history entries only, and leave
 * the history's index management to the component utilizing the search history.
 * */
export type SearchStoreHistoryItem = Array<string>;

// all search store types
export type SearchStoreType =
	| typeof GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY
	| typeof GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT
	| typeof GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVES
	| typeof GLOBAL_SEARCH_TYPE_VALUE_PARA_QUERIES;

// search store search types
export type SearchStoreSearchType =
	| typeof GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY
	| typeof GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT;

/**
 * Store for keeping tracking user search results.
 * TODO consider migrating search results to a new store, something like "application" store
 */
export const useSearchStore = create<SearchStore>()(
	subscribeWithSelector(
		persist(
			(set, get) => ({
				type: GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY,
				query: '',
				key: '',
				cypherQueryParameters: {},
				presentation: '',
				algorithm: GRAPH_LAYOUT_FORCE_ATLAS_2,
				style: '',
				result: {
					data: null,
					type: ''
				},
				isResultProcessed: false,
				isLoading: false,
				searchValue: GLOBAL_SEARCH_CYPHER_QUERY_DEFAULT_SEARCH_VALUE,
				newlyUploadedStyle: '',
				resetStyles: false,
				history: {
					[GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY]: [],
					[GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT]: []
				},
				setType: (type) => set({ type: type }),
				setQuery: (query) => set({ query: query }),
				setCypherQueryParameters: (parameters) => {
					set({ cypherQueryParameters: parameters });
				},
				setPresentation: (presentation) => set({ presentation: presentation }),
				setAlgorithm: (algorithm) => set({ algorithm: algorithm }),
				setStyle: (style) => set({ style: style }),
				setResult: (result) =>
					set({
						result: result
					}),
				setIsResultProcessed: (processed) => {
					set({ isResultProcessed: processed });
				},
				setSearchValue: (searchValue) => set({ searchValue: searchValue }),
				getDefaultSearchValue: (type) => {
					if (type === GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY) {
						return GLOBAL_SEARCH_CYPHER_QUERY_DEFAULT_SEARCH_VALUE;
					} else if (type === GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT) {
						return GLOBAL_SEARCH_FULL_TEXT_DEFAULT_SEARCH_VALUE;
					}

					return '';
				},
				getUrlSearchParameter: (key) => {
					return get().getUrlSearchParameters().get(key);
				},
				getUrlSearchParameters: () => {
					return new URL(window.location.href).searchParams;
				},
				setNewlyUploadedStyle: (style: string) => set({ newlyUploadedStyle: style }),
				setResetStyles: (updated: boolean) => set({ resetStyles: updated }),
				initialize: () => {
					const params = get().getUrlSearchParameters();

					const type = params.get(GLOBAL_SEARCH_TYPE_KEY);
					const query = params.get(GLOBAL_SEARCH_PARAMETER_KEY);
					const presentation = params.get(GLOBAL_SEARCH_PRESENTATION_KEY);
					const algorithm = params.get(GLOBAL_SEARCH_ALGORITHM_KEY) as LayoutModuleType;

					set({
						type:
							type && get().isSearchType(type)
								? type
								: GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY
					});
					set({ query: query || '' });
					set({ presentation: presentation || GRAPH_PRESENTATION_GRAPH });
					set({ algorithm: algorithm || GRAPH_LAYOUT_FORCE_ATLAS_2 });
					set({
						searchValue: query ? query : GLOBAL_SEARCH_CYPHER_QUERY_DEFAULT_SEARCH_VALUE
					});
				},
				setIsLoading: (value: boolean) => set({ isLoading: value }),
				addHistoryEntry: (type, value) => {
					const history = clone(get().history);
					let selectedHistory;

					if (get().isSearchType(type)) {
						selectedHistory = history[type];

						if (selectedHistory[0] !== value) {
							selectedHistory.unshift(value);

							set({
								history: history
							});
						}
					}
				},
				getSelectedHistory: () => {
					const history = get().history;
					const type = get().type;
					let selectedHistory;

					if (get().isSearchType(type)) {
						selectedHistory = history[type];
					}

					return selectedHistory;
				},
				exportSelectedHistory: () => {
					const selectedHistory = get().getSelectedHistory();
					const type = get().type;

					if (!selectedHistory) {
						return;
					}

					let content = '';

					selectedHistory.forEach((historyEntry, index) => {
						if (index) {
							content += '\n';
						}
						content += historyEntry;
						content += '\n';
						content += '------------------------------------------------';
					});

					downloadFile({
						content: content,
						mimeType: 'text/plain',
						name: 'graph-editor-' + type + '-search-history.txt'
					});
				},
				clearSelectedHistory: () => {
					const type = get().type;

					if (!get().isSearchType(type)) {
						return;
					}

					if (
						window.confirm(
							i18n.t('confirm_clear_search_history_entries', { type: type })
						)
					) {
						const history = clone(get().history);

						history[type] = [];

						set({
							history: history
						});
					}
				},
				isSearchType: (type): type is SearchStoreSearchType => {
					return (
						type === GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY ||
						type === GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT
					);
				}
			}),
			{
				name: APP_STORAGE_KEY_PREFIX + 'search', // name of the item in the storage (must be unique)
				storage: createJSONStorage(() => window.localStorage), // (optional) by default, 'localStorage' is used
				partialize: (store) => {
					return {
						history: store.history
					};
				}
			}
		)
	)
);
