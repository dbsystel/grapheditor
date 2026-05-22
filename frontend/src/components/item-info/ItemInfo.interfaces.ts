import { PropsWithChildren } from 'react';
import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { GlobalComponentProps } from 'src/types/components';

export type ItemInfoProps = GlobalComponentProps &
	PropsWithChildren & {
		item: Relation | Node;
		showTooltipOnHover?: boolean;
		asTag?: boolean;
	};
