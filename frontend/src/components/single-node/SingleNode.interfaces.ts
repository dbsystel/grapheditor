import { Node } from 'src/models/node';
import { GlobalComponentProps } from 'src/types/components';

export type SingleNodeProps = GlobalComponentProps & {
	node: Node;
	variant?: 'default' | 'small';
	isEditable?: boolean;
	shouldShowOpenButton?: boolean;
	shouldShowCenterButton?: boolean;
};

export type SingleNodeEditMode = 'none' | 'labels' | 'properties' | 'connections';
