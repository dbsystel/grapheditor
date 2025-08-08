import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { GlobalComponentProps } from 'src/types/components';

export type ItemInfoProps = GlobalComponentProps & {
	item: Relation | Node;
	showTooltipOnHover?: boolean;
};
