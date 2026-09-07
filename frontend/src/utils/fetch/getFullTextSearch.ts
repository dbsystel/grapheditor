import { StoppableRequest } from 'src/models/stoppable-request';
import { getNodes } from 'src/utils/fetch/getNodes';

export type GetFullTextSearchParameters = {
	searchTerm: string;
	stoppableRequest?: StoppableRequest;
};

//- if you change the order of fetching, please update the error handling
//  and other places where this function is used
//- we used to query relations as well, but it was decided by team to query only nodes for now (time of deactivation:
//  19.11.2025)
export const getFullTextSearch = ({
	searchTerm,
	stoppableRequest
}: GetFullTextSearchParameters) => {
	return Promise.all([
		getNodes({ searchTerm: searchTerm, stoppableRequest: stoppableRequest })
		// please leave the line below commented for future reference
		//getRelations({ searchTerm: searchTerm })
	]);
};
