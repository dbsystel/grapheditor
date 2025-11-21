import { getNodes } from 'src/utils/fetch/getNodes';

export type GetFullTextSearchParameters = { searchTerm: string };

//- if you change the order of fetching, please update the error handling
//  and other places where this function is used
//- we used to query relations as well, but it was decided by team to query only nodes for now (time of deactivation:
//  19.11.2025)
export const getFullTextSearch = ({ searchTerm }: GetFullTextSearchParameters) => {
	return Promise.all([
		getNodes({ searchTerm: searchTerm })
		// please leave the line below commented for future reference
		//getRelations({ searchTerm: searchTerm })
	]);
};
