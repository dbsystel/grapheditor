import { HomepageQueriesList, HomepageQuery } from 'src/models/homepage';
import { GlobalComponentProps } from 'src/types/components';

export type QueriesProp = GlobalComponentProps & {
	queries: HomepageQueriesList;
	onPlayClick: (query: HomepageQuery) => void;
};
