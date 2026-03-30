import { ItemOverviewPopover } from 'src/components/item-overview-popover/ItemOverviewPopover';
import { useItemOverviewPopoverStore } from 'src/stores/item-overview-popover';

export const ItemOverviewsRenderer = () => {
	const overviews = useItemOverviewPopoverStore((store) => store.overviews);

	return overviews.map((overview, index) => {
		return (
			<ItemOverviewPopover
				key={index + '-' + overview.item.id}
				item={overview.item}
				popoverRef={overview.triggerElement}
				popoverOffset={overview.popoverOffset}
				popoverPlacement={overview.popoverPlacement}
			/>
		);
	});
};
