import { Cartesian2D, Cartesian3D, Wgs8422D, Wgs8423D } from 'src/models/graph';
import { Node, NodeId } from 'src/models/node';
import { Relation, RelationId } from 'src/models/relation';

export type Item = Node | Relation;
export type ItemId = NodeId | RelationId;

export type ItemPropertyTypeString = 'string';
export type ItemPropertyTypeBoolean = 'boolean';
export type ItemPropertyTypeCartesian2D = 'cartesian_2d';
export type ItemPropertyTypeCartesian3D = 'cartesian_3d';
export type ItemPropertyTypeDate = 'date';
export type ItemPropertyTypeDatetime = 'datetime';
export type ItemPropertyTypeDuration = 'duration';
export type ItemPropertyTypeList = 'list';
export type ItemPropertyTypeFloat = 'float';
export type ItemPropertyTypeTime = 'time';
export type ItemPropertyTypeInteger = 'integer';
export type ItemPropertyTypeWgs8422D = 'wgs84_2d';
export type ItemPropertyTypeWgs8423D = 'wgs84_3d';
export type ItemPropertyDynamicTypeMap = 'map';
export type ItemPropertyDynamicTypeList = 'list';
export type ItemPropertyDynamicTypeUnknown = 'unknown';
export type ItemPropertyDynamicTypePath = 'path';

// node and relation properties
export type ItemProperty =
	| ItemPropertyShapeString
	| ItemPropertyShapeBoolean
	| ItemPropertyShapeCartesian2D
	| ItemPropertyShapeCartesian3D
	| ItemPropertyShapeDate
	| ItemPropertyShapeDatetime
	| ItemPropertyShapeDuration
	| ItemPropertyShapeList
	| ItemPropertyShapeFloat
	| ItemPropertyShapeTime
	| ItemPropertyShapeInteger
	| ItemPropertyShapeWgs8422D
	| ItemPropertyShapeWgs8423D;

// @formatter:off
// prettier-ignore
export type ItemPropertyBasedOnType<T extends ItemPropertyType> = T extends ItemPropertyTypeString
	? ItemPropertyShapeString
	: T extends ItemPropertyTypeBoolean
	? ItemPropertyShapeBoolean
	: T extends ItemPropertyTypeCartesian2D
	? ItemPropertyShapeCartesian2D
	: T extends ItemPropertyTypeCartesian3D
	? ItemPropertyShapeCartesian3D
	: T extends ItemPropertyTypeDate
	? ItemPropertyShapeDate
	: T extends ItemPropertyTypeDatetime
	? ItemPropertyShapeDatetime
	: T extends ItemPropertyTypeDuration
	? ItemPropertyShapeDuration
	: T extends ItemPropertyTypeList
	? ItemPropertyShapeList
	: T extends ItemPropertyTypeFloat
	? ItemPropertyShapeFloat
	: T extends ItemPropertyTypeTime
	? ItemPropertyShapeTime
	: T extends ItemPropertyTypeInteger
	? ItemPropertyShapeInteger
	: T extends ItemPropertyTypeWgs8422D
	? ItemPropertyShapeWgs8422D
	: T extends ItemPropertyTypeWgs8423D
	? ItemPropertyShapeWgs8423D
	: never;
// @formatter:on

// dynamic boxed values (e.g. cypher query result)
export type ItemPropertyDynamic =
	| ItemPropertyDynamicShapeMap
	| ItemPropertyDynamicShapeList
	| ItemPropertyDynamicShapeUnknown
	| ItemPropertyDynamicShapePath;

// @formatter:off
// prettier-ignore
export type ItemPropertyDynamicBasedOnType<T extends ItemPropertyDynamicType> =
	T extends ItemPropertyDynamicTypeMap
		? ItemPropertyDynamicTypeMap
		: T extends ItemPropertyDynamicTypeList
		? ItemPropertyDynamicTypeList
		: T extends ItemPropertyDynamicTypeUnknown
		? ItemPropertyDynamicTypeUnknown
		: T extends ItemPropertyDynamicTypePath
		? ItemPropertyDynamicTypePath
		: never;
// @formatter:on

// @formatter:off
// prettier-ignore
export type ItemPropertyTypeBasedOnType<T extends ItemPropertyType> = T extends ItemPropertyTypeString
	? ItemPropertyTypeString
	: T extends ItemPropertyTypeBoolean
	? ItemPropertyTypeBoolean
	: T extends ItemPropertyTypeCartesian2D
	? ItemPropertyTypeCartesian2D
	: T extends ItemPropertyTypeCartesian3D
	? ItemPropertyTypeCartesian3D
	: T extends ItemPropertyTypeDate
	? ItemPropertyTypeDate
	: T extends ItemPropertyTypeDatetime
	? ItemPropertyTypeDatetime
	: T extends ItemPropertyTypeDuration
	? ItemPropertyTypeDuration
	: T extends ItemPropertyTypeList
	? ItemPropertyTypeList
	: T extends ItemPropertyTypeFloat
	? ItemPropertyTypeFloat
	: T extends ItemPropertyTypeTime
	? ItemPropertyTypeTime
	: T extends ItemPropertyTypeInteger
	? ItemPropertyTypeInteger
	: T extends ItemPropertyTypeWgs8422D
	? ItemPropertyTypeWgs8422D
	: T extends ItemPropertyTypeWgs8423D
	? ItemPropertyTypeWgs8423D
	: never;
// @formatter:on

export type ItemPropertyShapeString = {
	type: ItemPropertyTypeString;
	value: string;
	edit?: boolean;
};

export type ItemPropertyShapeBoolean = {
	type: ItemPropertyTypeBoolean;
	value: boolean;
	edit?: boolean;
};

export type ItemPropertyShapeCartesian2D = {
	type: ItemPropertyTypeCartesian2D;
	value: Cartesian2D;
	edit?: boolean;
};

export type ItemPropertyShapeCartesian3D = {
	type: ItemPropertyTypeCartesian3D;
	value: Cartesian3D;
	edit?: boolean;
};

export type ItemPropertyShapeDate = {
	type: ItemPropertyTypeDate;
	value: string;
	edit?: boolean;
};

export type ItemPropertyShapeDatetime = {
	type: ItemPropertyTypeDatetime;
	value: string;
	edit?: boolean;
};

export type ItemPropertyShapeDuration = {
	type: ItemPropertyTypeDuration;
	value: string;
	edit?: boolean;
};

export type ItemPropertyShapeList = {
	type: ItemPropertyTypeList;
	value: Array<ItemPropertyShapeNonList>;
	edit?: boolean;
};

export type ItemPropertyShapeFloat = {
	type: ItemPropertyTypeFloat;
	value: number;
	edit?: boolean;
};

export type ItemPropertyShapeTime = {
	type: ItemPropertyTypeTime;
	value: string;
	edit?: boolean;
};

export type ItemPropertyShapeInteger = {
	type: ItemPropertyTypeInteger;
	value: number;
	edit?: boolean;
};

export type ItemPropertyShapeWgs8422D = {
	type: ItemPropertyTypeWgs8422D;
	value: Wgs8422D;
	edit?: boolean;
};

export type ItemPropertyShapeWgs8423D = {
	type: ItemPropertyTypeWgs8423D;
	value: Wgs8423D;
	edit?: boolean;
};

export type ItemPropertyDynamicShapeUnknown = {
	type: ItemPropertyDynamicTypeUnknown;
	value: unknown;
	edit?: unknown;
};

export type ItemPropertyDynamicShapeMap = {
	type: ItemPropertyDynamicTypeMap;
	value: Record<string, unknown>;
	edit?: boolean;
};

export type ItemPropertyDynamicShapeList = {
	type: ItemPropertyDynamicTypeList;
	value: Array<unknown>;
	edit?: boolean;
};

export type ItemPropertyDynamicShapePath = {
	type: ItemPropertyDynamicTypePath;
	value: Array<Node | Relation>;
	edit?: boolean;
};

export type ItemPropertyShapeNonList = Exclude<ItemProperty, { type: 'list' }>;

// TODO don't use this type, refactor to use ItemProperty + ItemPropertyKey where needed
//  (extracting ItemProperty generates a new object, meaning new reference))
export type ItemPropertyWithKey = ItemProperty & { key: ItemPropertyKey };
export type ItemPropertyKey = string;

export type ItemTypeNode = 'node';
export type ItemTypeRelation = 'relation';

export type ItemPropertyType =
	| ItemPropertyTypeBoolean
	| ItemPropertyTypeCartesian2D
	| ItemPropertyTypeCartesian3D
	| ItemPropertyTypeDate
	| ItemPropertyTypeDatetime
	| ItemPropertyTypeDuration
	| ItemPropertyTypeList
	| ItemPropertyTypeFloat
	| ItemPropertyTypeTime
	| ItemPropertyTypeInteger
	| ItemPropertyTypeString
	| ItemPropertyTypeWgs8422D
	| ItemPropertyTypeWgs8423D;

export type ItemPropertyDynamicType =
	| ItemPropertyDynamicTypeMap
	| ItemPropertyDynamicTypeList
	| ItemPropertyDynamicTypeUnknown
	| ItemPropertyDynamicTypePath;

export type ItemPropertyTypeWithListSubtypes =
	| ItemPropertyTypeNonList
	| `list_${ItemPropertyTypeNonList}`;

export type ItemPropertyTypeNonList = Exclude<ItemPropertyType, 'list'>;

export type ItemProperties = Record<string, ItemProperty>;
