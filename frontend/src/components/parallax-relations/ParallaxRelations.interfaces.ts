import { RelationType } from 'src/models/relation';
import { GlobalComponentProps } from 'src/types/components';

export type ParallaxRelationsProps = GlobalComponentProps & {
	nextStepRelations: {
		incomingRelationTypes: Array<RelationType>;
		outgoingRelationTypes: Array<RelationType>;
	};
	selectedRelations: {
		incomingRelationTypes: Array<string>;
		outgoingRelationTypes: Array<string>;
	};
	onRelationChange: ParallaxRelationsOnChange;
};

export type ParallaxRelationsRowProps = {
	relationType: RelationType;
	type: 'incomingRelationTypes' | 'outgoingRelationTypes';
	onChange: ParallaxRelationsOnChange;
	isSelected: boolean;
};

type ParallaxRelationsOnChange = (
	relationType: string,
	type: 'incomingRelationTypes' | 'outgoingRelationTypes',
	checked: boolean
) => void;
