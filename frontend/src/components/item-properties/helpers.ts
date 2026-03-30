import {
	ItemPropertiesTableEntries,
	ItemPropertiesTableEntry
} from 'src/components/item-properties-table/ItemPropertiesTable.interfaces';
import i18n from 'src/i18n';
import { ItemProperties, ItemProperty, ItemPropertyKey } from 'src/models/item';
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
		const arrayEntry: ItemPropertiesTableEntry = [property, key, propertyNodesCache[key]];

		if (topEntriesPropertyKeys.includes(key)) {
			newTopEntries.push(arrayEntry);
		} else {
			newCompleteTableEntries.push(arrayEntry);
		}
	});

	// filter data by (selected) labels meta data
	const filterTableEntriesByMetaPropertyIds = (tableEntries: ItemPropertiesTableEntries) => {
		return tableEntries.filter((tableEntry) => {
			return processedPropertyIds.includes(tableEntry[1]);
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

export const showNotificationForInvalidProperties = (propertyKeys: Array<string>) => {
	useNotificationsStore.getState().addNotification({
		title: i18n.t('notifications_warning_properties_not_valid_title'),
		description: i18n.t('notifications_warning_properties_not_valid_description', {
			propertyKeys: propertyKeys.join(',')
		}),
		type: 'warning',
		autoCloseAfterMilliseconds: 0,
		isClosable: true
	});
};

export class PropertiesStorageClass {
	properties: ItemProperties;

	constructor(defaultProperties?: ItemProperties) {
		this.properties = defaultProperties || {};
	}

	getProperty(key: ItemPropertyKey) {
		const properties = this.properties;
		return properties[key];
	}
	setProperty(key: ItemPropertyKey, property: ItemProperty) {
		const propertiesClone = clone(this.properties);

		propertiesClone[key] = property;

		this.setProperties(propertiesClone);
	}
	deleteProperty(key: ItemPropertyKey) {
		const propertiesClone = clone(this.properties);

		delete propertiesClone[key];

		this.setProperties(propertiesClone);
	}
	setProperties(properties: ItemProperties) {
		this.properties = properties;
	}
	reset() {
		this.properties = {};
	}
}
