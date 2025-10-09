import { RelationType } from 'src/models/relation';
import { GlobalComponentProps } from 'src/types/components';

export type RightWidgetProps = GlobalComponentProps;

export type ParallaxRelationsProps = {
	nextStepRelations: {
		incomingRelationTypes: Array<RelationType>;
		outgoingRelationTypes: Array<RelationType>;
	};
	selectedRelations: {
		incomingRelationTypes: string[];
		outgoingRelationTypes: string[];
	};
	onRelationChange: (
		relationName: string,
		type: 'incomingRelationTypes' | 'outgoingRelationTypes',
		checked: boolean
	) => void;
	className?: string;
};
