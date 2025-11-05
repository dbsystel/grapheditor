import { DBButton, DBCard } from '@db-ux/react-core-components';
import { useState } from 'react';
import { ContextMenuTopBlock } from 'src/components/context-menu/sub-menu/top-block/ContextMenuTopBlock';
import { ItemInfo } from 'src/components/item-info/ItemInfo';
import { ItemPropertiesAddNewProperty } from 'src/components/item-properties/tabs/add-new-property/ItemPropertiesAddNewProperty';
import { Table } from 'src/components/table/Table';
import { TableBody } from 'src/components/table-body/TableBody';
import { TableCell } from 'src/components/table-cell/TableCell';
import { TableHead } from 'src/components/table-head/TableHead';
import { TableRow } from 'src/components/table-row/TableRow';
import i18n from 'src/i18n';
import {
	ItemProperties,
	ItemProperty,
	ItemPropertyKey,
	ItemPropertyWithKey
} from 'src/models/item';
import { Node, PatchNode } from 'src/models/node';
import { PatchRelation } from 'src/models/relation';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useItemsStore } from 'src/stores/items';
import { nodesApi } from 'src/utils/api/nodes';
import { relationsApi } from 'src/utils/api/relations';
import { clone } from 'src/utils/helpers/general';
import { ContextMenuSubMenu } from '../sub-menu/ContextMenuSubMenu';

export const AddPropertiesAction = ({ goBack }: { goBack: () => void }) => {
	const [newProperties, setNewProperties] = useState<
		Record<ItemPropertyKey, { property: ItemProperty; node: Node }>
	>({});

	const onPropertyCreate = (newProperty: ItemPropertyWithKey, propertyNode: Node) => {
		const newPropertiesClone = clone(newProperties);

		newPropertiesClone[newProperty.key] = {
			property: {
				value: newProperty.value,
				type: newProperty.type,
				edit: newProperty.edit
			},
			node: propertyNode
		};

		setNewProperties(newPropertiesClone);
	};

	const patchItems = async () => {
		const selectedNodeIds = useContextMenuStore.getState().nodeIds;
		const selectedRelationIds = useContextMenuStore.getState().relationIds;

		if (window.confirm(i18n.t('context_menu__add_properties_action_overwrite_warning'))) {
			const patchNodes: Array<PatchNode> = [];
			const patchRelations: Array<PatchRelation> = [];
			const storeNodes = useItemsStore.getState().getStoreNodes(selectedNodeIds);
			const storeRelations = useItemsStore.getState().getStoreRelations(selectedRelationIds);
			const adaptedNewProperties: ItemProperties = {};

			for (const [key, value] of Object.entries(newProperties)) {
				adaptedNewProperties[key] = {
					type: value.property.type,
					value: value.property.value,
					edit: value.property.edit
				};
			}

			storeNodes.forEach((storeNode) => {
				patchNodes.push({
					id: storeNode.id,
					properties: {
						...storeNode.properties,
						...adaptedNewProperties
					}
				});
			});

			storeRelations.forEach((storeRelation) => {
				patchRelations.push({
					id: storeRelation.id,
					properties: {
						...storeRelation.properties,
						...adaptedNewProperties
					}
				});
			});

			useContextMenuStore.getState().setIsActionLoading(true);

			if (patchNodes.length) {
				await nodesApi.patchNodesAndUpdateApplication(patchNodes);
			}
			if (patchRelations.length) {
				await relationsApi.patchRelationsAndUpdateApplication(patchRelations);
			}

			useContextMenuStore.getState().close();
		}
	};

	const propertyKeys = Object.keys(newProperties);
	const hasNewProperties = propertyKeys.length > 0;
	const isApplyButtonDisabled = !hasNewProperties;
	const applyButtonText = i18n.t('context_menu__add_properties_action_apply_button');
	const propertyKeyHeading = i18n.t('form_property_key');
	const propertyValueHeading = i18n.t('form_property_value');
	const propertyTypeHeading = i18n.t('form_property_type');

	return (
		<ContextMenuSubMenu className="context-menu__paste-properties-action">
			<ContextMenuTopBlock closeSubMenuFunction={goBack} />
			<ItemPropertiesAddNewProperty onPropertyCreate={onPropertyCreate} />
			{hasNewProperties && (
				<DBCard className="context-menu__expanded-content">
					<div>
						<Table>
							<TableHead>
								<TableRow>
									<TableCell>{propertyKeyHeading}</TableCell>
									<TableCell width="full">{propertyValueHeading}</TableCell>
									<TableCell>{propertyTypeHeading}</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{propertyKeys.map((propertyKey) => {
									const propertyEntry = newProperties[propertyKey];

									return (
										<TableRow key={propertyKey}>
											<TableCell>
												{<ItemInfo item={propertyEntry.node} />}
											</TableCell>
											<TableCell>{propertyEntry.property.value}</TableCell>
											<TableCell>{propertyEntry.property.type}</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				</DBCard>
			)}
			<DBButton onClick={patchItems} disabled={isApplyButtonDisabled} variant="brand">
				{applyButtonText}
			</DBButton>
		</ContextMenuSubMenu>
	);
};
