import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';

export type Item = Node | Relation;

export type ItemProperty = {
	value: string | boolean | number;
	edit: boolean;
	type: ItemPropertyType;
};
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
