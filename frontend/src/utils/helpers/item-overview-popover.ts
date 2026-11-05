import { DrawerStoreEntry } from 'src/stores/drawer';
import { useItemOverviewPopoverStore } from 'src/stores/item-overview-popover';

export const getDrawerEntriesFromOverviews = (): Array<DrawerStoreEntry> => {
	return useItemOverviewPopoverStore
		.getState()
		.overviews.map((overview) => ({ item: overview.item }));
};
