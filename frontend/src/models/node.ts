import { StyleProperties } from 'src/models/general';
import { ItemProperties, ItemTypeNode } from 'src/models/item';
import { Relation } from 'src/models/relation';
import { Overwrite, RequireAtLeastOne } from 'src/types/general';

export type Node = {
	_grapheditor_type: ItemTypeNode;
	id: NodeId;
	// Pseudo nodes won't have this key
	dbId?: NodeId;
	// 1. Only nodes containing the label MetaLabel, MetaRelation or MetaProperty will
	//	  have "semanticId" key fulfilled
	// 2. Pseudo nodes won't have this key
	semanticId?: NodeId | null;
	title: string;
	description: string;
	longDescription: string;
	labels: NodeLabels;
	properties: ItemProperties;
	style: StyleProperties;
};

/**
 * For general work with backend API please use the above Node type.
 * There are 3 main reasons:
 * 1. Backend will sometimes deliver Node and sometimes PseudoNode, based on if
 * 	  the resource has been defined or not
 * 2. If we define a value as "value: Node | MetaNode", we still need to use a helper
 * 	  function (or manually check) to determine if the value is of type Node or MetaNode
 * 3. We'd have to refactor a lot, and I don't feel like refactoring now (2 small
 * 	  children, not enough sleep)
 *
 *  The only reason why I would recommend to use types below is to have a separation
 *  of concerns. But the above points currently heavily overrule this point.
 */

export type MetaNode = Overwrite<
	Node,
	{
		semanticId: NodeId;
	}
>;

/**
 * See the comment above.
 */
export type PseudoNode = Overwrite<
	Node,
	{
		dbId: never;
		semanticId: never;
	}
>;

export type NonPseudoNode = Overwrite<
	Node,
	{
		dbId: string;
	}
>;

// pick fields which we can patch
export type PatchNodePick = Pick<
	Node,
	'labels' | 'description' | 'longDescription' | 'properties' | 'title'
>;
// require at least one key from the PatchNodePick type
export type PatchNodePartial = RequireAtLeastOne<PatchNodePick>;
// make the node ID key required
// note: TS might throw an error saying the property X is required in this type, but it means one of
// PatchNodePick type keys is required, not exactly the one TS says
export type PatchNode = { id: NodeId } & PatchNodePartial;

export type NodeId = string;
export type NodeLabel = string;
export type NodeLabelId = string;
export type NodeLabels = Array<NodeLabelId>;

export type MetaForMeta = Record<NodeId, Array<Node>>;

export type NodeConnections = {
	relations: Array<NodeConnection>;
};

export type NodeConnection = {
	direction: 'incoming' | 'outgoing';
	neighbor: Node;
	relation: Relation;
};
