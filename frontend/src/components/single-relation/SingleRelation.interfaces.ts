import { Relation } from 'src/models/relation';
import { GlobalComponentProps } from 'src/types/components';

export type SingleRelationProps = GlobalComponentProps & {
	relation: Relation;
	variant?: 'default' | 'small';
	isEditable?: boolean;
	shouldShowOpenButton?: boolean;
	shouldShowCenterButton?: boolean;
};

export type SingleRelationEditMode = 'none' | 'type' | 'properties';
