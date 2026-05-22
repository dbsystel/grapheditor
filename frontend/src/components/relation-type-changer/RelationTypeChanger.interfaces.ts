import { RefObject } from 'react';
import { Relation } from 'src/models/relation';
import { GlobalComponentProps, UnsavedChangesHandle } from 'src/types/components';

export type RelationTypeChangerProps = GlobalComponentProps & {
	onRelationTypeChange?: (relation: Relation) => void;
	relation: Relation;
	isEditMode?: boolean;
	handleRef?: RefObject<RelationTypeChangerHandle>;
};

export type RelationTypeChangerHandle = UnsavedChangesHandle;
