import { StyleProperties } from 'src/models/general';
import { ItemProperties, ItemTypeRelation } from 'src/models/item';
import { NodeId } from 'src/models/node';
import { RequireAtLeastOne } from 'src/types/general';

export type Relation = RelationBase & {
	style: StyleProperties;
};

export type RelationBase = {
	_grapheditor_type: ItemTypeRelation;
	id: RelationId;
	dbId: RelationId;
	title: string;
	description: string;
	longDescription?: string;
	type: RelationType;
	properties: ItemProperties;
	source_id: NodeId;
	target_id: NodeId;
};

export type RelationId = string;
export type RelationType = string;

// pick fields which we can patch
type PatchRelationPick = Pick<
	Relation,
	'title' | 'description' | 'longDescription' | 'type' | 'properties'
>;
// require at least one key from the PatchNodePick type
type PatchRelationPartial = RequireAtLeastOne<PatchRelationPick>;
// make the node ID key required
// note: TS might throw an error saying the property X is required in this type, but it means one of
// PatchNodePick type keys is required, not exactly the one TS says
export type PatchRelation = { id: RelationId } & PatchRelationPartial;

const a: PatchRelation = {
	id: 'd',
	type: 'a'
};

console.log(a);
