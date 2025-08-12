import { getFullTextSearch } from 'src/utils/fetch/getFullTextSearch';
import { postCypherQuerySearch } from 'src/utils/fetch/postCypherQuerySearch';

export const searchApi = {
	getFullTextSearch: getFullTextSearch,
	postCypherQuerySearch: postCypherQuerySearch
};
