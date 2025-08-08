import { ItemPropertiesTableEntries } from 'src/components/item-properties/table/ItemPropertiesTable.interfaces';
import { Item } from 'src/models/item';
import { MetaForMeta, Node, NodeId } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { endpoints } from 'src/utils/endpoints';
import { getNodeMetaPropertyType, isMetaNode } from 'src/utils/helpers/nodes';
import { isRelation } from 'src/utils/helpers/relations';

export const getItemEndpoint = (item: Node | Relation) => {
	return isRelation(item)
		? endpoints.getRelationPath({ relationId: item.id })
		: endpoints.getNodePath({ nodeId: item.id });
};

export const getItemDBId = (item: Item) => {
	return item.dbId || item.id;
};

export const getItemMissingPropertiesForMeta = (item: Item, metaData: MetaForMeta) => {
	const missingProperties: ItemPropertiesTableEntries = [];
	const missingPropertiesIds: Array<NodeId> = [];
	const processedIds: Array<string> = [];

	const itemPropertyKeys = Object.keys(item.properties);
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

				if (!processedIds.includes(propertyNode.semanticId)) {
					processedIds.push(propertyNode.semanticId);

					missingProperties.push([
						item,
						{
							key: propertyNode.semanticId,
							edit: true,
							value: '',
							type: propertyType
						},
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
