import { StyleProperties } from 'src/models/general';
import { ItemProperties, ItemTypeRelation } from 'src/models/item';
import { NodeId } from 'src/models/node';

export type Relation = {
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
	style: StyleProperties;
};

export type RelationId = string;
export type RelationType = string;
