import { HomepageQuery, HomepageQueryGroup } from 'src/models/homepage';

export const isHomepageQueryGroup = (
	item: HomepageQuery | HomepageQueryGroup
): item is HomepageQueryGroup => {
	return 'queries' in item;
};
