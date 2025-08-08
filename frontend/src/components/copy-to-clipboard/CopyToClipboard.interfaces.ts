import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { GlobalComponentProps } from 'src/types/components';

export type CopyToClipboardProps = GlobalComponentProps & {
	text?: string;
	nodes?: Array<Node>;
	relations?: Array<Relation>;
};
