import { useSearchStore } from 'src/stores/search';
import { api } from 'src/utils/api/api';
import { getParaQueries } from 'src/utils/fetch/getParaQueries';
import { getParaQuery } from 'src/utils/fetch/getParaQuery';

export const paraQueriesApi = {
	fetch: {
		getParaQueries: getParaQueries,
		getParaQuery: getParaQuery
	},
	actions: {
		executeParaQuery: async (
			cyperQuery: string,
			cypherQueryParameters: Record<string, string>
		) => {
			useSearchStore.getState().setQuery(cyperQuery);
			useSearchStore.getState().setCypherQueryParameters(cypherQueryParameters);

			api.search.actions.executeSearch();
		}
	}
};
