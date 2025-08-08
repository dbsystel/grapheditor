// if you change the order of fetching, please update the error handling
// where this function is being used
import { getNodes } from 'src/utils/fetch/getNodes';
import { getRelations } from 'src/utils/fetch/getRelations';

export type GetFullTextSearchParameters = { searchTerm: string };

export const getFullTextSearch = ({ searchTerm }: GetFullTextSearchParameters) => {
	return Promise.all([
		getNodes({ searchTerm: searchTerm }),
		getRelations({ searchTerm: searchTerm })
	]);
};
