import { ItemPropertyKey } from 'src/models/item';
import { Node, NodeId, NodeLabelId, NodeLabels } from 'src/models/node';
import { RelationType } from 'src/models/relation';

export type ParallaxData = {
	nodes: Record<NodeId, Node>;
	properties: Array<ItemPropertyKey>;
	labels: Array<NodeLabelId>;
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
