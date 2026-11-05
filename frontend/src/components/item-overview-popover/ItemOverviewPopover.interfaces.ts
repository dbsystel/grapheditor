import { Placement } from '@floating-ui/react';
import { Item } from 'src/models/item';
import { GlobalComponentProps } from 'src/types/components';

export type ItemOverviewPopoverProps = GlobalComponentProps & {
	item: Item;
	popoverRef: HTMLElement | null;
	popoverOffset?: number;
	popoverPlacement?: Placement;
};
