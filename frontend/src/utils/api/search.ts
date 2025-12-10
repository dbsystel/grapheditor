import { isAxiosError } from 'axios';
import { useDrawerStore } from 'src/stores/drawer';
import { SearchResultType, SearchStoreType, useSearchStore } from 'src/stores/search';
import { CypherQuerySearchResult } from 'src/types/cypherQuerySearchResult';
import {
	GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY,
	GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT,
	GLOBAL_SEARCH_TYPE_VALUE_PARA_QUERY
} from 'src/utils/constants';
import { getFullTextSearch } from 'src/utils/fetch/getFullTextSearch';
import { postCypherQuerySearch } from 'src/utils/fetch/postCypherQuerySearch';
import { parseError } from 'src/utils/helpers/general';
import { buildSimpleSearchResult } from 'src/utils/helpers/search';

export const searchApi = {
	getFullTextSearch: getFullTextSearch,
	postCypherQuerySearch: postCypherQuerySearch,
	executeSearch: executeSearch
};

async function executeSearch(parameters?: {
	query?: string;
	type?: SearchStoreType;
	cypherQueryParameters?: Record<string, string>;
}) {
	const query = parameters?.query || useSearchStore.getState().query;
	const cypherQueryParameters =
		parameters?.cypherQueryParameters || useSearchStore.getState().cypherQueryParameters;
	const type = parameters?.type || useSearchStore.getState().type;
	let searchResultType: SearchResultType = '';

	if (!query.trim()) {
		return;
	}

	useSearchStore.getState().setResult({ data: null, type: '' });
	useSearchStore.getState().setIsLoading(true);

	useDrawerStore.getState().reset();

	let responseResult: CypherQuerySearchResult = [];

	try {
		// if cypher query search or para-query
		if (
			type === GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY ||
			type === GLOBAL_SEARCH_TYPE_VALUE_PARA_QUERY
		) {
			const response = await searchApi.postCypherQuerySearch({
				queryText: query || '',
				parameters: cypherQueryParameters
			});

			responseResult = response.data.result;
			searchResultType = type;
		}
		// if regular, full-text search
		else if (type === GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT) {
			const responses = await searchApi.getFullTextSearch({
				searchTerm: query || ''
			});
			// make full-text search results format consistent with the cypher query
			// results format, so we can reuse existing components
			responseResult = buildSimpleSearchResult(
				responses[0].data // nodes API response
			);
			searchResultType = GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT;
		}
	} catch (error) {
		if (isAxiosError(error)) {
			Promise.reject(error);
		} else {
			throw new Error(parseError(error));
		}
	} finally {
		useSearchStore.getState().setIsLoading(false);
		useSearchStore.getState().setResult({ data: responseResult, type: searchResultType });
	}
}
