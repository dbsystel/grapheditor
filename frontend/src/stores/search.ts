import { isAxiosError } from 'axios';
import { CypherQuerySearchResult } from 'src/types/cypherQuerySearchResult';
import { searchApi } from 'src/utils/api/search';
import {
	GLOBAL_SEARCH_ALGORITHM_KEY,
	GLOBAL_SEARCH_CYPHER_QUERY_DEFAULT_SEARCH_VALUE,
	GLOBAL_SEARCH_PARAMETER_KEY,
	GLOBAL_SEARCH_PRESENTATION_KEY,
	GLOBAL_SEARCH_TYPE_KEY,
	GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY,
	GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT,
	GRAPH_LAYOUT_FORCE_ATLAS_2,
	GRAPH_PRESENTATION_GRAPH
} from 'src/utils/constants';
import { parseError } from 'src/utils/helpers/general';
import { isNode } from 'src/utils/helpers/nodes';
import { create } from 'zustand';

export type LayoutModuleType =
	| 'random'
	| 'force-atlas-2'
	| 'force'
	| 'noverlap'
	| 'perspective'
	| 'none';

type SearchStore = {
	type: string; // TODO define explicit type instead of general string
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
	setType: (type: string) => void;
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
	setResetStyles: (value: boolean) => void;
};

/**
 * Store for keeping track what type of query a user chose and what the query is.
 */

export const useSearchStore = create<SearchStore>((set, get) => ({
	type: '',
	query: '',
	key: '',
	presentation: '',
	algorithm: GRAPH_LAYOUT_FORCE_ATLAS_2,
	style: '',
	result: null,
	isResultProcessed: false,
	isLoading: false,
	searchValue: '',
	newlyUploadedStyle: '',
	resetStyles: false,
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
				const response = await searchApi.postCypherQuerySearch({ queryText: query || '' });

				responseResult = response.data.result;
			}
			// if regular, full-text search
			else if (type === GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT) {
				const responses = await searchApi.getFullTextSearch({ searchTerm: query || '' });
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

		set({ type: type || GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY });
		set({ query: query || '' });
		set({ presentation: presentation || GRAPH_PRESENTATION_GRAPH });
		set({ algorithm: algorithm || GRAPH_LAYOUT_FORCE_ATLAS_2 });
		set({ searchValue: query ? query : GLOBAL_SEARCH_CYPHER_QUERY_DEFAULT_SEARCH_VALUE });
	},
	setIsLoading: (value: boolean) => set({ isLoading: value })
}));
