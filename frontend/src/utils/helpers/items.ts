import { ItemPropertiesTableEntries } from 'src/components/item-properties-table/ItemPropertiesTable.interfaces';
import {
	Item,
	ItemProperties,
	ItemProperty,
	ItemPropertyBasedOnType,
	ItemPropertyDynamic,
	ItemPropertyDynamicShapeList,
	ItemPropertyDynamicShapeMap,
	ItemPropertyDynamicShapePath,
	ItemPropertyDynamicShapeUnknown,
	ItemPropertyDynamicType,
	ItemPropertyKey,
	ItemPropertyShapeBoolean,
	ItemPropertyShapeCartesian2D,
	ItemPropertyShapeCartesian3D,
	ItemPropertyShapeDate,
	ItemPropertyShapeDatetime,
	ItemPropertyShapeDuration,
	ItemPropertyShapeFloat,
	ItemPropertyShapeInteger,
	ItemPropertyShapeList,
	ItemPropertyShapeString,
	ItemPropertyShapeTime,
	ItemPropertyShapeWgs8422D,
	ItemPropertyShapeWgs8423D,
	ItemPropertyType,
	ItemPropertyTypeNonList,
	ItemPropertyTypeWithListSubtypes,
	ItemPropertyWithKey
} from 'src/models/item';
import { MetaForMeta, Node, NodeId } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { useDrawerStore } from 'src/stores/drawer';
import { useItemOverviewPopoverStore } from 'src/stores/item-overview-popover';
import {
	ITEM_PROPERTY_DYNAMIC_TYPES,
	ITEM_PROPERTY_TYPES,
	ITEM_PROPERTY_TYPES_MAPPED
} from 'src/utils/constants';
import { endpoints } from 'src/utils/endpoints';
import {
	convertBooleanToString,
	convertStringToBoolean,
	getDateFromString,
	isArray,
	isBoolean,
	isDate,
	isDatetime,
	isDuration,
	isInteger,
	isNumber,
	isObject,
	isString,
	isTime,
	parseError
} from 'src/utils/helpers/general';
import { isCartesian2D, isCartesian3D, isWgs8422D, isWgs8423D } from 'src/utils/helpers/graph';
import { getNodeMetaPropertyType, isMetaNode, isNode } from 'src/utils/helpers/nodes';
import { isRelation } from 'src/utils/helpers/relations';

export const getItemEndpoint = (item: Node | Relation) => {
	return isRelation(item)
		? endpoints.getRelationPath({ relationId: item.id })
		: endpoints.getNodePath({ nodeId: item.id });
};

export const getItemDBId = (item: Item) => {
	return item.dbId || item.id;
};

export const isItemPropertyOfValidShapeDuration = (
	property: ItemProperty
): property is ItemPropertyShapeDuration => {
	return isItemPropertyOfTypeDuration(property) && isDuration(property.value);
};

export const isItemPropertyOfTypeDuration = (property: ItemProperty) => {
	return property.type === 'duration';
};

export const isItemPropertyOfValidShapeString = (
	property: ItemProperty
): property is ItemPropertyShapeString => {
	return isItemPropertyOfTypeString(property) && isString(property.value);
};

export const isItemPropertyOfTypeString = (property: ItemProperty) => {
	return property.type === 'string';
};

export const isItemPropertyOfValidShapeFloat = (
	property: ItemProperty
): property is ItemPropertyShapeFloat => {
	// backend accepts both integer and float for float type
	return isItemPropertyOfTypeFloat(property) && isNumber(property.value);
};

export const isItemPropertyOfTypeFloat = (property: ItemProperty) => {
	return property.type === 'float';
};

export const isItemPropertyOfValidShapeInteger = (
	property: ItemProperty
): property is ItemPropertyShapeInteger => {
	return isItemPropertyOfTypeInteger(property) && isInteger(property.value);
};

export const isItemPropertyOfTypeInteger = (property: ItemProperty) => {
	return property.type === 'integer';
};

export const isItemPropertyOfValidShapeDate = (
	property: ItemProperty
): property is ItemPropertyShapeDate => {
	return isItemPropertyOfTypeDate(property) && isDate(property.value);
};

export const isItemPropertyOfTypeDate = (property: ItemProperty) => {
	return property.type === 'date';
};

export const isItemPropertyOfValidShapeTime = (
	property: ItemProperty
): property is ItemPropertyShapeTime => {
	return isItemPropertyOfTypeTime(property) && isTime(property.value);
};

export const isItemPropertyOfTypeTime = (property: ItemProperty) => {
	return property.type === 'time';
};

export const isItemPropertyOfValidShapeDatetime = (
	property: ItemProperty
): property is ItemPropertyShapeDatetime => {
	// use isDatetime instead of isString once we have a proper datetime with UTC UI presentation
	return isItemPropertyOfTypeDatetime(property) && isDatetime(property.value);
};

export const isItemPropertyOfTypeDatetime = (property: ItemProperty) => {
	return property.type === 'datetime';
};

export const isItemPropertyOfValidShapeBoolean = (
	property: ItemProperty
): property is ItemPropertyShapeBoolean => {
	return isItemPropertyOfTypeBoolean(property) && isBoolean(property.value);
};

export const isItemPropertyOfTypeBoolean = (property: ItemProperty) => {
	return property.type === 'boolean';
};

export const isItemPropertyOfValidShapeCartesian2D = (
	property: ItemProperty
): property is ItemPropertyShapeCartesian2D => {
	return isItemPropertyOfTypeCartesian2D(property) && isCartesian2D(property.value);
};

export const isItemPropertyOfTypeCartesian2D = (property: ItemProperty) => {
	return property.type === 'cartesian_2d';
};

export const isItemPropertyOfValidShapeCartesian3D = (
	property: ItemProperty
): property is ItemPropertyShapeCartesian3D => {
	return isItemPropertyOfTypeCartesian3D(property) && isCartesian3D(property.value);
};

export const isItemPropertyOfTypeCartesian3D = (property: ItemProperty) => {
	return property.type === 'cartesian_3d';
};

export const isItemPropertyOfValidShapeWgs842D = (
	property: ItemProperty
): property is ItemPropertyShapeWgs8422D => {
	return isItemPropertyOfTypeWgs842D(property) && isWgs8422D(property.value);
};

export const isItemPropertyOfTypeWgs842D = (property: ItemProperty) => {
	return property.type === 'wgs84_2d';
};

export const isItemPropertyOfValidShapeWgs843D = (
	property: ItemProperty
): property is ItemPropertyShapeWgs8423D => {
	return isItemPropertyOfTypeWgs843D(property) && isWgs8423D(property.value);
};

export const isItemPropertyOfTypeWgs843D = (property: ItemProperty) => {
	return property.type === 'wgs84_3d';
};

export const isItemPropertyOfValidShapeList = (
	property: ItemProperty
): property is ItemPropertyShapeList => {
	return isItemPropertyOfTypeList(property) && isArray(property.value);
};

export const isItemPropertyOfTypeList = (property: ItemProperty) => {
	return property.type === 'list';
};

export const isItemPropertyOfValidDynamicShapeMap = (
	property: ItemPropertyDynamic
): property is ItemPropertyDynamicShapeMap => {
	return isItemPropertyOfDynamicTypeMap(property) && isObject(property.value);
};

export const isItemPropertyOfDynamicTypeMap = (property: ItemPropertyDynamic) => {
	return property.type === 'map';
};

// unlike property type "list" for normal item properties, here we only need to check that value is an array,
// because this type supports all boxed values inside the list (mixed as well)
export const isItemPropertyOfValidDynamicShapeList = (
	property: ItemPropertyDynamic
): property is ItemPropertyDynamicShapeList => {
	return isItemPropertyOfDynamicTypeList(property) && isArray(property.value);
};

export const isItemPropertyOfDynamicTypeList = (property: ItemPropertyDynamic) => {
	return property.type === 'list';
};

export const isItemPropertyOfValidDynamicShapeUnknown = (
	property: ItemPropertyDynamic
): property is ItemPropertyDynamicShapeUnknown => {
	return isItemPropertyOfDynamicTypeUnknown(property) && property.value !== undefined;
};

export const isItemPropertyOfDynamicTypeUnknown = (property: ItemPropertyDynamic) => {
	return property.type === 'unknown';
};

export const isItemPropertyOfValidDynamicShapePath = (
	property: ItemPropertyDynamic
): property is ItemPropertyDynamicShapePath => {
	return (
		isItemPropertyOfDynamicTypePath(property) &&
		isArray(property.value) &&
		property.value.every((entry) => {
			return isNode(entry) || isRelation(entry);
		})
	);
};

export const isItemPropertyOfDynamicTypePath = (property: ItemProperty | ItemPropertyDynamic) => {
	return property.type === 'path';
};

/**
 * The reason we need this function for lists but not for other types is simple: each property validation
 * validates two things: if property type matches and if property value matches the expected shape for that type.
 * For lists, the property value is an array of other item properties, so we need to validate each of those
 * item properties individually to ensure they are valid.
 *
 * Example:
 * 	- isItemPropertyOfValidShapeString({type: 'string', value: 'hello'}) returns true
 * 	- isItemPropertyOfValidShapeString({type: 'string', value: 1}) returns false
 * 	- isItemPropertyOfValidShapeList({type: 'list', value: [{type: 'string', value: 'hello'}, {type: 'integer', value: 5}]}) returns true
 * 	- isItemPropertyOfValidShapeList({type: 'list', value: [{type: 'string', value: 1}, {type: 'integer', value: 5}]}) also returns true (
 * 	because the shape is correct, since we are expecting an array)
 */
export const isItemPropertyListValid = (property: ItemPropertyShapeList): boolean => {
	if (property.value.length === 0) {
		return true;
	}

	const firstItemType = property.value[0].type;

	return property.value.every((itemProperty) => {
		return itemProperty.type === firstItemType && isItemPropertyValid(itemProperty);
	});
};

export const isItemPropertyDynamicValid = (property: ItemPropertyDynamic) => {
	try {
		switch (property.type) {
			case 'map':
				return isItemPropertyOfValidDynamicShapeMap(property);
			case 'list':
				return isItemPropertyOfValidDynamicShapeList(property);
			case 'unknown':
				return isItemPropertyOfValidDynamicShapeUnknown(property);
			case 'path':
				return isItemPropertyOfValidDynamicShapePath(property);
			default:
				// better safe than sorry
				assertNever(property);
		}
	} catch {
		return false;
	}
};

export const isItemPropertyValid = (property: ItemProperty) => {
	try {
		switch (property.type) {
			case 'string':
				return isItemPropertyOfValidShapeString(property);
			case 'duration':
				return isItemPropertyOfValidShapeDuration(property);
			case 'integer':
				return isItemPropertyOfValidShapeInteger(property);
			case 'float':
				return isItemPropertyOfValidShapeFloat(property);
			case 'date':
				return isItemPropertyOfValidShapeDate(property);
			case 'time':
				return isItemPropertyOfValidShapeTime(property);
			case 'datetime':
				return isItemPropertyOfValidShapeDatetime(property);
			case 'boolean':
				return isItemPropertyOfValidShapeBoolean(property);
			case 'cartesian_2d':
				return isItemPropertyOfValidShapeCartesian2D(property);
			case 'cartesian_3d':
				return isItemPropertyOfValidShapeCartesian3D(property);
			case 'wgs84_2d':
				return isItemPropertyOfValidShapeWgs842D(property);
			case 'wgs84_3d':
				return isItemPropertyOfValidShapeWgs843D(property);
			case 'list':
				return (
					isItemPropertyOfValidShapeList(property) && isItemPropertyListValid(property)
				);
			default:
				// better safe than sorry
				assertNever(property);
		}
	} catch {
		return false;
	}
};

/**
 * Helper for exhaustive checks in switch statements
 * Put an assertNever in the default branch.
 * If you forget a case, a won’t be never and TypeScript errors.
 */
export function assertNever(x: never): never {
	throw new Error(`Unexpected value: ${x}`);
}

export const areItemPropertiesValid = (itemProperties: ItemProperties) => {
	const invalidKeys: Array<ItemPropertyKey> = [];

	for (const key in itemProperties) {
		const itemProperty = itemProperties[key];

		if (!isItemPropertyValid(itemProperty)) {
			invalidKeys.push(key);
		}
	}

	return {
		isValid: invalidKeys.length === 0,
		invalidKeys: invalidKeys
	};
};

// warning: this function only checks the shape of the object, not the validity of its value
export const isItemProperty = (value: unknown): value is ItemProperty => {
	if (!isObject(value)) {
		return false;
	}

	const typeOk = 'type' in value && isItemPropertyTypeValid(value.type);
	const valueOk = 'value' in value;
	const editOk = 'edit' in value && isBoolean(value.edit);

	return (
		(Object.keys(value).length === 2 && typeOk && valueOk) ||
		(Object.keys(value).length === 3 && typeOk && valueOk && editOk)
	);
};

// warning: this function only checks the shape of the object, not the validity of its value
export const isItemPropertyDynamic = (value: unknown): value is ItemPropertyDynamic => {
	if (!isObject(value)) {
		return false;
	}

	const typeOk = 'type' in value && isItemPropertyDynamicTypeValid(value.type);
	const valueOk = 'value' in value;

	return Object.keys(value).length === 2 && typeOk && valueOk;
};

export const isItemPropertyTypeValid = (type: unknown): type is ItemPropertyType => {
	return isString(type) && ITEM_PROPERTY_TYPES.some((value) => value === type);
};

export const isItemPropertyDynamicTypeValid = (type: unknown): type is ItemPropertyDynamicType => {
	return isString(type) && ITEM_PROPERTY_DYNAMIC_TYPES.some((value) => value === type);
};

export const isItemPropertyTypeNonList = (type: unknown): type is ItemPropertyTypeNonList => {
	return isItemPropertyTypeValid(type) && type !== ITEM_PROPERTY_TYPES_MAPPED.list;
};

export const isItemPropertyTypeWithListSubtypes = (
	type: unknown
): type is ItemPropertyTypeWithListSubtypes => {
	if (isItemPropertyTypeNonList(type)) {
		return true;
	}

	if (isString(type) && type.startsWith('list_')) {
		const subType = type.replace('list_', '');

		return isItemPropertyTypeNonList(subType);
	}

	return false;
};

export const itemPropertyDefaults: { [K in ItemPropertyType]: () => ItemPropertyBasedOnType<K> } = {
	string: () => {
		return { type: 'string', value: '', edit: true };
	},
	boolean: () => {
		return { type: 'boolean', value: false, edit: true };
	},
	cartesian_2d: () => {
		return { type: 'cartesian_2d', value: { x: 0, y: 0 }, edit: true };
	},
	cartesian_3d: () => {
		return { type: 'cartesian_3d', value: { x: 0, y: 0, z: 0 }, edit: true };
	},
	date: () => {
		return { type: 'date', value: new Date().toISOString().split('T')[0], edit: true };
	},
	datetime: () => {
		return { type: 'datetime', value: new Date().toISOString(), edit: true };
	},
	duration: () => {
		return { type: 'duration', value: 'P1DT0H', edit: true };
	},
	list: () => {
		return { type: 'list', value: [], edit: true };
	},
	float: () => {
		return { type: 'float', value: 0.0, edit: true };
	},
	time: () => {
		return { type: 'time', value: '00:00:00', edit: true };
	},
	integer: () => {
		return { type: 'integer', value: 0, edit: true };
	},
	wgs84_2d: () => {
		return { type: 'wgs84_2d', value: { latitude: 0, longitude: 0 }, edit: true };
	},
	wgs84_3d: () => {
		return { type: 'wgs84_3d', value: { latitude: 0, longitude: 0, height: 0 }, edit: true };
	}
};

export function getDefaultItemPropertyForItemPropertyType<T extends ItemPropertyType>(
	type: T
): ItemPropertyBasedOnType<T> {
	return itemPropertyDefaults[type]();
}

export function convertItemPropertyToNewType<T extends ItemPropertyType>(
	property: ItemProperty,
	newType: T
): ItemPropertyBasedOnType<T> | undefined {
	const defaultProperty = getDefaultItemPropertyForItemPropertyType(newType);

	try {
		switch (newType) {
			case 'string': {
				if (isBoolean(property.value)) {
					defaultProperty.value = convertBooleanToString(property.value);
				} else if (isNumber(property.value)) {
					defaultProperty.value = property.value.toString();
				} else if (isItemPropertyOfTypeList(property)) {
					if (property.value.length === 0) {
						defaultProperty.value = '';
						return defaultProperty;
					}

					const arrayOfPrimitives = property.value.reduce<Array<number | string>>(
						(accumulator, currentProperty) => {
							if (isNumber(currentProperty.value)) {
								accumulator.push(String(currentProperty.value));
							} else if (isObject(currentProperty.value)) {
								accumulator.push(JSON.stringify(currentProperty.value));
							} else if (isString(currentProperty.value)) {
								accumulator.push(currentProperty.value);
							} else if (isBoolean(currentProperty.value)) {
								accumulator.push(convertBooleanToString(currentProperty.value));
							}

							return accumulator;
						},
						[]
					);

					if (arrayOfPrimitives.length) {
						defaultProperty.value = arrayOfPrimitives.join(',');
					} else {
						defaultProperty.value = JSON.stringify(property.value);
					}
				}

				return defaultProperty;
			}
			case 'boolean': {
				if (isString(property.value)) {
					defaultProperty.value = convertStringToBoolean(property.value);
				} else if (isNumber(property.value)) {
					defaultProperty.value = Boolean(property.value);
				}

				return defaultProperty;
			}
			case 'integer': {
				if (isNumber(property.value)) {
					defaultProperty.value = Math.floor(property.value);
				} else if (isString(property.value)) {
					defaultProperty.value = parseInt(property.value, 10) || defaultProperty.value;
				}
				break;
			}
			case 'float': {
				if (isNumber(property.value)) {
					defaultProperty.value = property.value;
				} else if (isString(property.value)) {
					defaultProperty.value = parseFloat(property.value) || defaultProperty.value;
				}
				break;
			}
			case 'date':
				if (isString(property.value)) {
					const date = getDateFromString(property.value);

					if (date) {
						defaultProperty.value = date;
					}
				}
				break;
			case 'datetime':
			case 'list':
			case 'cartesian_2d':
			case 'cartesian_3d':
			case 'duration':
			case 'time':
			case 'wgs84_2d':
			case 'wgs84_3d':
				return defaultProperty;
			default:
				assertNever(newType);
		}
	} catch (error) {
		console.error(
			`Error converting property to new type "${newType}". Error: ${parseError(error)}`
		);
		return undefined;
	}

	return defaultProperty;
}

export const extractItemPropertyFromItemPropertyWithKey = (
	propertyWithKey: ItemPropertyWithKey
): ItemProperty => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { key, ...property } = propertyWithKey;

	return property;
};

export const getItemMissingPropertiesForMeta = (
	itemProperties: ItemProperties,
	metaData: MetaForMeta
) => {
	const missingProperties: ItemPropertiesTableEntries = [];
	const missingPropertiesIds: Array<NodeId> = [];
	const processedIds: Array<string> = [];

	const itemPropertyKeys = Object.keys(itemProperties);
	for (const [nodeId, propertyNodes] of Object.entries(metaData)) {
		propertyNodes.forEach((propertyNode) => {
			const propertyType = getNodeMetaPropertyType(propertyNode);

			if (!propertyType) {
				console.warn(
					`Property node with ID ${propertyNode.id} does not contain a "type" property.`
				);
			} else if (
				isMetaNode(propertyNode) &&
				!itemPropertyKeys.includes(propertyNode.semanticId) &&
				propertyType
			) {
				missingPropertiesIds.push(nodeId);
				const defaultProperty = getDefaultItemPropertyForItemPropertyType(propertyType);

				if (
					!processedIds.includes(propertyNode.semanticId) &&
					defaultProperty !== undefined
				) {
					processedIds.push(propertyNode.semanticId);

					missingProperties.push([
						defaultProperty,
						propertyNode.semanticId,
						propertyNode
					]);
				}
			}
		});
	}

	return {
		missingPropertiesIds: missingPropertiesIds,
		missingProperties: missingProperties
	};
};

export const openInItemsDrawer = (item: Item, isInsideItemsDrawer: boolean) => {
	const overviewEntries = useItemOverviewPopoverStore
		.getState()
		.overviews.map((overview) => ({ item: overview.item }));

	useItemOverviewPopoverStore.getState().reset();

	if (isInsideItemsDrawer) {
		useDrawerStore.getState().addEntry({ item: item });
	} else {
		const existingDrawerEntries = useDrawerStore.getState().entries;

		useDrawerStore.getState().setEntries([...existingDrawerEntries, ...overviewEntries]);
	}
};

/**
 * Please leave this function commented out.
 *
 * This was an attempt to be able to use only one patch function for both nodes and relations bulk patch.
 * In order to be able to distinguish between patch nodes and patch relations, we must use the
 * 	"_grapheditor_type" key. This key has to first manually be added and the later removed from
 * 	objects before we send them to server, otherwise server will fail at patching (it accepts only
 * 	specific object keys, and "_grapheditor_type" is not one of them).
 * 	Since it looks like we won't save many lines of code, we opted out for using the respected bulk
 * 	patch methods instead, to keep things simple.
 *
 * 	It all boils down to:
 *
 * 	const patchItem = {
 * 	    id: item.id,
 * 	    properties: ...,
 * 	    _grapheditor_type: item._grapheditor_type
 * 	}
 *
 * 	patchItemsAndUpdateApplication([patchItem])
 *
 * 	VS
 *
 * 	const patchItem = {
 * 		id: item.id,
 * 	    properties: ...,
 * 	}
 *
 * 	if (isNode(item)) {
 * 	    nodesApi.patchNodesAndUpdateApplication([patchItem])
 * 	} else if (isRelation(item)) {
 * 	    relationsApi.patchRelationsAndUpdateApplication([patchItem])
 * 	}
 * */
// export const patchItemsAndUpdateApplication = <T extends ItemTypeNode | ItemTypeRelation>(
// 	items:
// 		| Array<PatchNode & { _grapheditor_type: T }>
// 		| Array<PatchRelation & { _grapheditor_type: T }>
// ) => {
// 	if (isArrayOfNodes(items)) {
// 		return nodesApi.patchNodesAndUpdateApplication(
// 			items.map((item) => {
// 				const { _grapheditor_type, ...rest } = item;
//
// 				return rest;
// 			})
// 		);
// 	} else if (isArrayOfRelations(items)) {
// 		return relationsApi.patchRelationsAndUpdateApplication(
// 			items.map((item) => {
// 				const { _grapheditor_type, ...rest } = item;
//
// 				return rest;
// 			})
// 		);
// 	}
// };
