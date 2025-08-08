import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { GlobalComponentProps } from 'src/types/components';

export type ConnectionsProps = GlobalComponentProps & {
	node: Node;
};

export type ConnectionsData = Array<{
	source?: Node;
	relation?: Relation;
	target?: Node;
}>;

export type ConnectionsBoxProps = {
	title?: string;
	data: ConnectionsData;
	node: Node;
	direction: ConnectionDirection;
	onDelete: (relation: Relation) => void;
	className?: string;
};

export type ConnectionObject = {
	source?: Node;
	relation?: Relation;
	target?: Node;
};

export type ConnectionDirection = 'incoming' | 'outgoing';
