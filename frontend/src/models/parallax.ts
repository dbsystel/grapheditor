import { Node, NodeId, NodeLabels } from 'src/models/node';
import { RelationType } from 'src/models/relation';

export type ParallaxData = {
	nodes: Record<NodeId, Node>;
	properties: Array<Node>;
	labels: Array<Node>;
	incomingRelationTypes: Record<RelationType, ParallaxRelationCountType>;
	outgoingRelationTypes: Record<RelationType, ParallaxRelationCountType>;
};

export type ParallaxRelationCountType = {
	count: number;
};

export type ParallaxInitialQuery = {
	filters: ParallaxFilters;
	nodeIds: Array<NodeId>;
};

export type ParallaxFilters = {
	properties: Record<string, string>;
	labels: NodeLabels;
};

export type ParallaxSteps = Array<{
	filters: ParallaxFilters;
	incomingRelationTypes: Array<string>;
	outgoingRelationTypes: Array<string>;
}>;
