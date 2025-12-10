import { useSearchStore } from 'src/stores/search';
import { searchApi } from 'src/utils/api/search';

export const paraQueriesApi = {
	executeParaQuery: async (cyperQuery: string, cypherQueryParameters: Record<string, string>) => {
		useSearchStore.getState().setQuery(cyperQuery);
		useSearchStore.getState().setCypherQueryParameters(cypherQueryParameters);

		searchApi.executeSearch();
	}
};
