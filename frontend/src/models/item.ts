import { Node, NodeId } from 'src/models/node';
import { Relation, RelationId } from 'src/models/relation';

export type Item = Node | Relation;
export type ItemId = NodeId | RelationId;

export type ItemProperty = {
	value: ItemPropertyValue;
	edit: boolean;
	type: ItemPropertyType;
};
export type ItemPropertyValue = string | Array<string> | boolean | number;
export type ItemPropertyWithKey = ItemProperty & { key: ItemPropertyKey };
export type ItemPropertyKey = string;

export type ItemTypeNode = 'node';
export type ItemTypeRelation = 'relation';

export type ItemPropertyType =
	| 'boolean'
	| 'date'
	| 'duration'
	| 'float'
	| 'integer'
	| 'list_boolean'
	| 'list_date'
	| 'list_duration'
	| 'list_float'
	| 'list_integer'
	| 'list_local_datetime'
	| 'list_local_time'
	| 'list_point'
	| 'list_string'
	| 'list_zoned_time'
	| 'local_datetime'
	| 'local_time'
	| 'point'
	| 'string'
	| 'zoned_time';

export type ItemProperties = Record<string, ItemProperty>;
