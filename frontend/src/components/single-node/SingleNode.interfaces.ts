import { Node } from 'src/models/node';
import { GlobalComponentProps } from 'src/types/components';

export type SingleNodeProps = GlobalComponentProps & {
	node: Node;
};

export type EditMode = 'none' | 'labels' | 'properties';
