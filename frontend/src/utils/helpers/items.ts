import { ItemPropertiesTableEntries } from 'src/components/item-properties/table/ItemPropertiesTable.interfaces';
import { Item, ItemProperties } from 'src/models/item';
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

				if (!processedIds.includes(propertyNode.semanticId)) {
					processedIds.push(propertyNode.semanticId);

					missingProperties.push([
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

/**
 * Please leave this function commented out.
 *
 * This was an attempt to be able to use only one patch function for both nodes and relations bulk patch.
 * In order to be able to distinguish between patch nodes and patch relations, we must use the
 * 	"_grapheditor_type" key. This key has to first manually be added and the later removed from
 * 	objects before we send them to server, otherwise server will fail at patching (it accepts only
 * 	specific object keys, and "_grapheditor_type" is not one of them).
 * 	Since it looks like we won't save many lines of code, we opted out for using the respected bulk
 * 	patch methods instead to keep things simple.
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
