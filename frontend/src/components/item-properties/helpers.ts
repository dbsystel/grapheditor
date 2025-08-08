import {
	ItemPropertiesTableEntries,
	ItemPropertiesTableEntry
} from 'src/components/item-properties/table/ItemPropertiesTable.interfaces';
import i18n from 'src/i18n';
import { Item, ItemPropertyKey, ItemPropertyType, ItemPropertyWithKey } from 'src/models/item';
import { MetaForMeta, Node, NodeId } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { useItemsStore } from 'src/stores/items';
import { useNotificationsStore } from 'src/stores/notifications';
import { patch } from 'src/utils/fetch/patch';
import { getItemEndpoint, getItemMissingPropertiesForMeta } from 'src/utils/helpers/items';
import { isMetaNode, isNode } from 'src/utils/helpers/nodes';

export const deleteProperty = (
	item: Node | Relation,
	property: ItemPropertyWithKey,
	callback: (item: Item) => void
) => {
	const propertyClone = window.structuredClone(item);

	if (
		window.confirm(
			`Delete property ${property.key} for ${isNode(item) ? 'node' : 'relation'} with ID ${
				item.id
			} ?`
		)
	) {
		const addNotification = useNotificationsStore.getState().addNotification;
		const t = i18n.t;

		delete propertyClone.properties[property.key];

		patch<typeof item>(getItemEndpoint(item), {
			properties: propertyClone.properties
		}).then((response) => {
			if (callback) {
				callback(response.data);
			}

			addNotification({
				title: t('notifications_success_property_mode', {
					mode: t('notifications_prefix_delete')
				}),
				type: 'successful'
			});
		});
	}
};

export const changePropertyType = async (
	item: Node | Relation,
	property: ItemPropertyWithKey,
	propertyType: ItemPropertyType,
	callback: (updatedItem: Item, property: ItemPropertyWithKey, propertyNode: Node) => void
) => {
	const propertiesClone = window.structuredClone(item.properties);
	const addNotification = useNotificationsStore.getState().addNotification;
	const t = i18n.t;

	propertiesClone[property.key].type = propertyType;
	const getNodeAsync = useItemsStore.getState().getNodeAsync;

	const patchResponse = await patch<Item>(getItemEndpoint(item), {
		properties: propertiesClone
	});
	const updatedPropertyNode = await getNodeAsync(property.key, true);

	callback(
		patchResponse.data,
		{
			...patchResponse.data.properties[property.key],
			key: property.key
		},
		updatedPropertyNode
	);

	addNotification({
		title: t('notifications_success_property_mode', {
			mode: t('notifications_suffix_edit')
		}),
		type: 'successful'
	});
};

export const processItemPropertiesEntries = ({
	propertyNodes,
	metaData,
	filterMetaByNodeIds,
	item,
	topEntriesPropertyKeys
}: {
	propertyNodes: Array<Node>;
	metaData?: MetaForMeta;
	filterMetaByNodeIds?: Array<NodeId>;
	item: Item;
	topEntriesPropertyKeys: Array<ItemPropertyKey>;
}) => {
	const propertyNodesCache: Record<NodeId, Node> = {};
	const metaForMetaClone = window.structuredClone(metaData);
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
			item,
			metaForMetaClone
		).missingProperties;
	}

	Object.entries(item.properties).forEach(([key, property]) => {
		const arrayEntry: ItemPropertiesTableEntry = [
			item,
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
			return processedPropertyIds.includes(tableEntry[1].key);
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
