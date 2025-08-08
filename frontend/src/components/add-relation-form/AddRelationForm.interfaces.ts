import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { GlobalComponentProps } from 'src/types/components';

export type AddRelationFormProps = GlobalComponentProps & {
	refNode: Node;
	onSave?: (sourceNode: Node, targetNode: Node, relation: Relation) => void;
};
