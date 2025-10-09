import { RefObject } from 'react';
import { Relation, RelationType } from 'src/models/relation';
import { GlobalComponentProps } from 'src/types/components';

export type RelationTypeChangerProps = GlobalComponentProps & {
	onRelationTypeChange?: (relation: Relation) => void;
	relation: Relation;
	showTooltipOnHover?: boolean;
	isEditMode?: boolean;
	handleRef?: RefObject<RelationTypeChangerHandle>;
};

export type RelationTypeChangerHandle = {
	handleSave: () => Promise<void>;
	handleUndo: () => void;
	type: RelationType;
} | null;
