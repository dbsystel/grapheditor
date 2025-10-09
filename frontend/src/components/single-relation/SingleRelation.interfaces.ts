import { Relation } from 'src/models/relation';
import { GlobalComponentProps } from 'src/types/components';

export type SingleRelationProps = GlobalComponentProps & {
	relation: Relation;
};

export type EditMode = 'none' | 'type' | 'properties';
