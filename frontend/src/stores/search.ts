import { isAxiosError } from 'axios';
import i18n from 'src/i18n';
import { CypherQuerySearchResult } from 'src/types/cypherQuerySearchResult';
import { searchApi } from 'src/utils/api/search';
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
	GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVES,
	GRAPH_LAYOUT_FORCE_ATLAS_2,
	GRAPH_PRESENTATION_GRAPH
} from 'src/utils/constants';
import { parseError } from 'src/utils/helpers/general';
import { isNode } from 'src/utils/helpers/nodes';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type LayoutModuleType =
	| 'random'
	| 'force-atlas-2'
	| 'force'
	| 'noverlap'
	| 'perspective'
	| 'none';

// TODO remove "perspective" pieces of the store
type SearchStore = {
	type: SearchStoreType;
	query: string;
	key: string;
	presentation: string;
	algorithm: LayoutModuleType;
	style: string;
	result: CypherQuerySearchResult | null;
	isResultProcessed: boolean;
	searchValue: string;
	newlyUploadedStyle: string;
	resetStyles: boolean;
	getUrlSearchParameter: (key: string) => ReturnType<URLSearchParams['get']>;
	getUrlSearchParameters: () => URLSearchParams;
	setType: (type: SearchStoreType) => void;
	setQuery: (query: string) => void;
	setResult: (result: CypherQuerySearchResult | null) => void;
	setIsResultProcessed: (processed: boolean) => void;
	setNewlyUploadedStyle: (style: string) => void;
	initialize: () => void;
	isLoading: boolean;
	setIsLoading: (value: boolean) => void;
	setPresentation: (presentation: string) => void;
	setAlgorithm: (algorithm: LayoutModuleType) => void;
	setStyle: (style: string) => void;
	executeSearch: () => Promise<void>;
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
	| typeof GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVES;

// search store search types
export type SearchStoreSearchType =
	| typeof GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY
	| typeof GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT;

/**
 * Store for keeping track what type of query a user chose and what the query is.
 */

export const useSearchStore = create<SearchStore>()(
	persist(
		(set, get) => ({
			type: GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY,
			query: '',
			key: '',
			presentation: '',
			algorithm: GRAPH_LAYOUT_FORCE_ATLAS_2,
			style: '',
			result: null,
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
			setPresentation: (presentation) => set({ presentation: presentation }),
			setAlgorithm: (algorithm) => set({ algorithm: algorithm }),
			setStyle: (style) => set({ style: style }),
			setResult: (result) => set({ result: result }),
			setIsResultProcessed: (processed) => {
				set({ isResultProcessed: processed });
			},
			executeSearch: async () => {
				const query = get().query;
				const type = get().type;

				if (!query.trim()) {
					return;
				}

				get().setResult(null);
				get().setIsLoading(true);

				let responseResult: CypherQuerySearchResult = [];

				try {
					// if cypher query search
					if (type === GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY) {
						const response = await searchApi.postCypherQuerySearch({
							queryText: query || ''
						});

						responseResult = response.data.result;
					}
					// if regular, full-text search
					else if (type === GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT) {
						const responses = await searchApi.getFullTextSearch({
							searchTerm: query || ''
						});
						// make full-text search results format consistent with the cypher query
						// results format, so we can reuse existing components
						const result: CypherQuerySearchResult = [];

						responses.forEach((response) => {
							response.data.forEach((item, index) => {
								if (!result[index]) {
									result[index] = [
										['', ''],
										['', '']
									];
								}

								if (isNode(item)) {
									result[index][0] = ['Node', item];
								} else {
									result[index][1] = ['Relation', item];
								}
							});
						});

						responseResult = result;
					}
				} catch (error) {
					if (isAxiosError(error)) {
						Promise.reject(error);
					} else {
						throw new Error(parseError(error));
					}
				} finally {
					get().setIsLoading(false);
					get().setResult(responseResult);
				}
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
				const history = window.structuredClone(get().history);
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

				const anchorElement = document.createElement('a');
				const file = new Blob([content], { type: 'text/plain' });
				anchorElement.href = URL.createObjectURL(file);
				anchorElement.download = 'graph-editor-' + type + '-search-history.txt';
				anchorElement.click();
			},
			clearSelectedHistory: () => {
				const type = get().type;

				if (!get().isSearchType(type)) {
					return;
				}

				console.log('---clearSelectedHistory');

				if (
					window.confirm(i18n.t('confirm_clear_search_history_entries', { type: type }))
				) {
					const history = window.structuredClone(get().history);

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
);
