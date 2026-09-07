import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { GlobalComponentProps } from 'src/types/components';

export type AddRelationFormProps = GlobalComponentProps & {
	refNode: Node;
	onSave?: (sourceNode: Node, targetNode: Node, relation: Relation) => void;
};

export type AddRelationFormNodesState = {
	from: AddRelationFormNodeState;
	to: AddRelationFormNodeState;
};

export type AddRelationFormNodeState = {
	nodes: Array<Node>;
	hasMore: boolean;
	optionDelimiterAfterIndexes: Array<number>;
};
