import { HomepageQuery } from 'src/models/general';
import { GlobalComponentProps } from 'src/types/components';

export type QueriesProp = GlobalComponentProps & {
	queries: Array<HomepageQuery>;
	onPlayClick: (query: HomepageQuery) => void;
};
