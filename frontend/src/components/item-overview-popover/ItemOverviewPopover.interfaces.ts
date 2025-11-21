import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { GlobalComponentProps } from 'src/types/components';

export type ItemOverviewPopoverProps = GlobalComponentProps & {
	item: Relation | Node;
	popoverRef: HTMLElement | null;
	popoverOffset?: number;
};
