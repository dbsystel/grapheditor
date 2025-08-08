import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { GlobalComponentProps } from 'src/types/components';

export type ItemOverviewTooltipProps = GlobalComponentProps & {
	item: Relation | Node;
	tooltipRef: HTMLElement | null;
	tooltipOffset?: number;
};
