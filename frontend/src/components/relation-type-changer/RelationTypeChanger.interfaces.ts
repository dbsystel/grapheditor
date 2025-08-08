import { Relation } from 'src/models/relation';
import { GlobalComponentProps } from 'src/types/components';

export type RelationTypeChangerProps = GlobalComponentProps & {
	onRelationTypeChange?: (relation: Relation) => void;
	relation: Relation;
	showTooltipOnHover?: boolean;
};
