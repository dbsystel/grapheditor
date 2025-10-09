import {
	ItemPropertiesTableEntries,
	ItemPropertiesTableEntry
} from 'src/components/item-properties/table/ItemPropertiesTable.interfaces';
import i18n from 'src/i18n';
import { ItemProperties, ItemPropertyKey, ItemPropertyType } from 'src/models/item';
import { MetaForMeta, Node, NodeId } from 'src/models/node';
import { useNotificationsStore } from 'src/stores/notifications';
import { clone } from 'src/utils/helpers/general';
import { getItemMissingPropertiesForMeta } from 'src/utils/helpers/items';
import { isMetaNode } from 'src/utils/helpers/nodes';

export const processItemPropertiesEntries = ({
	propertyNodes,
	metaData,
	filterMetaByNodeIds,
	itemProperties,
	topEntriesPropertyKeys
}: {
	propertyNodes: Array<Node>;
	metaData?: MetaForMeta;
	filterMetaByNodeIds?: Array<NodeId>;
	itemProperties: ItemProperties;
	topEntriesPropertyKeys: Array<ItemPropertyKey>;
}) => {
	const propertyNodesCache: Record<NodeId, Node> = {};
	const metaForMetaClone = clone(metaData);
	const newCompleteTableEntries: ItemPropertiesTableEntries = [];
	let newIncompleteTableEntries: ItemPropertiesTableEntries = [];
	const newTopEntries: ItemPropertiesTableEntries = [];
	const shouldFilterData = !!filterMetaByNodeIds?.length;
	const processedPropertyIds: Array<string> = [];

	propertyNodes.forEach((propertyNode) => {
		propertyNodesCache[propertyNode.id] = propertyNode;
	});

	if (metaForMetaClone) {
		// filter metaForMeta by selected label IDs
		if (shouldFilterData) {
			Object.keys(metaForMetaClone).forEach((labelId) => {
				if (!filterMetaByNodeIds.includes(labelId)) {
					delete metaForMetaClone[labelId];
				}
			});
		}

		// prevent same properties between different labels
		for (const [, properties] of Object.entries(metaForMetaClone)) {
			properties.forEach((property) => {
				if (isMetaNode(property) && !processedPropertyIds.includes(property.semanticId)) {
					processedPropertyIds.push(property.semanticId);
				}
			});
		}

		// get missing properties
		newIncompleteTableEntries = getItemMissingPropertiesForMeta(
			itemProperties,
			metaForMetaClone
		).missingProperties;
	}

	Object.entries(itemProperties).forEach(([key, property]) => {
		const arrayEntry: ItemPropertiesTableEntry = [
			{ ...property, key: key },
			propertyNodesCache[key]
		];

		if (topEntriesPropertyKeys.includes(key)) {
			newTopEntries.push(arrayEntry);
		} else {
			newCompleteTableEntries.push(arrayEntry);
		}
	});

	// filter data by (selected) labels meta data
	const filterTableEntriesByMetaPropertyIds = (tableEntries: ItemPropertiesTableEntries) => {
		return tableEntries.filter((tableEntry) => {
			return processedPropertyIds.includes(tableEntry[0].key);
		});
	};

	return {
		newCompleteEntries: shouldFilterData
			? filterTableEntriesByMetaPropertyIds(newCompleteTableEntries)
			: newCompleteTableEntries,
		newIncompleteEntries: shouldFilterData
			? filterTableEntriesByMetaPropertyIds(newIncompleteTableEntries)
			: newIncompleteTableEntries,
		newTopEntries: shouldFilterData
			? filterTableEntriesByMetaPropertyIds(newTopEntries)
			: newTopEntries
	};
};

export const parsePropertyValue = (propertyType: ItemPropertyType, propertyValue: string) => {
	const lowerCaseValue = propertyValue.toLowerCase();

	try {
		switch (propertyType) {
			case 'boolean':
				if (lowerCaseValue === 'false') {
					return false;
				} else if (lowerCaseValue === 'true') {
					return true;
				} else {
					return null;
				}
			case 'float':
			case 'integer': {
				const floatParsedValue = parseFloat(propertyValue);

				if (isNaN(floatParsedValue)) {
					return null;
				}

				return floatParsedValue;
			}
			default:
				return propertyValue;
		}
	} catch {
		return null;
	}
};

export const validateItemProperties = (properties: ItemProperties) => {
	for (const key in properties) {
		const itemProperty = properties[key];

		if (parsePropertyValue(itemProperty.type, itemProperty.value.toString()) === null) {
			// item property is not valid
			return false;
		}
	}

	// item properties are valid
	return true;
};

export const getPropertyValuePlaceholder = (propertyType: ItemPropertyType) => {
	switch (propertyType) {
		case 'boolean':
			return i18n.t('form_property_value_boolean_placeholder');
		case 'float':
			return i18n.t('form_property_value_float_placeholder');
		case 'integer':
			return i18n.t('form_property_value_integer_placeholder');
		default:
			return i18n.t('form_property_value_string_placeholder');
	}
};

export const showNotificationForPropertyTypeAndValueMismatch = () => {
	useNotificationsStore.getState().addNotification({
		title: i18n.t('notifications_warning_property_type_value_mismatch_title'),
		description: i18n.t('notifications_warning_property_type_value_mismatch_description'),
		type: 'warning',
		autoCloseAfterMilliseconds: 0,
		isClosable: true
	});
};
