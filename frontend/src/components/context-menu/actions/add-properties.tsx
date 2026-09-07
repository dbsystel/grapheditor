import { DBButton } from '@db-ux/react-core-components';
import { useRef, useState } from 'react';
import { AddNewProperty } from 'src/components/add-new-property/AddNewProperty';
import { AddNewPropertyHandle } from 'src/components/add-new-property/AddNewProperty.interfaces';
import { ContextMenuTopBlock } from 'src/components/context-menu/sub-menu/top-block/ContextMenuTopBlock';
import { ItemPropertiesTable } from 'src/components/item-properties-table/ItemPropertiesTable';
import { ItemPropertiesTableEntryWithTopFlag } from 'src/components/item-properties-table/ItemPropertiesTable.interfaces';
import i18n from 'src/i18n';
import { ItemProperties, ItemProperty, ItemPropertyKey } from 'src/models/item';
import { Node, PatchNode } from 'src/models/node';
import { PatchRelation } from 'src/models/relation';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useItemsStore } from 'src/stores/items';
import { useNotificationsStore } from 'src/stores/notifications';
import { api } from 'src/utils/api/api';
import { clone } from 'src/utils/helpers/general';
import { ContextMenuSubMenu } from '../sub-menu/ContextMenuSubMenu';
import { NewPropertiesMap } from './add-properties.interfaces';

export const AddPropertiesAction = ({ goBack }: { goBack: () => void }) => {
	const addNewPropertyHandleRef = useRef<AddNewPropertyHandle>(null);
	const [newProperties, setNewProperties] = useState<NewPropertiesMap>({});
	const onPropertyCreate = async (
		key: ItemPropertyKey,
		newProperty: ItemProperty,
		propertyNode?: Node
	) => {
		const newPropertiesClone = clone(newProperties);
		let newPropertyNode = propertyNode;

		if (!propertyNode) {
			const response = await api.nodes.fetch.postNodesBulkFetch({
				nodeIds: [key]
			});
			const responseNode = Object.values(response.data.nodes).at(0);

			if (responseNode) {
				newPropertyNode = responseNode;
			} else {
				useNotificationsStore.getState().addNotification({
					title: i18n.t(
						'notifications_warning_context_menu_add_properties_node_fetch_fail',
						{
							id: key
						}
					),
					type: 'warning'
				});
			}
		}

		newPropertiesClone[key] = {
			property: newProperty,
			node: newPropertyNode
		};

		setNewProperties(newPropertiesClone);
	};

	const patchItems = async () => {
		if (addNewPropertyHandleRef.current?.hasPendingData()) {
			const submitted = await addNewPropertyHandleRef.current.submitPendingData();

			if (!submitted) {
				return;
			}
		}

		const propertyKeysToApply = Object.keys(newProperties);

		if (propertyKeysToApply.length === 0) {
			return;
		}

		const selectedNodeIds = useContextMenuStore.getState().nodeIds;
		const selectedRelationIds = useContextMenuStore.getState().relationIds;

		if (window.confirm(i18n.t('context_menu__add_properties_action_overwrite_warning'))) {
			const patchNodes: Array<PatchNode> = [];
			const patchRelations: Array<PatchRelation> = [];
			const storeNodes = useItemsStore.getState().getStoreNodes(selectedNodeIds);
			const storeRelations = useItemsStore.getState().getStoreRelations(selectedRelationIds);
			const adaptedNewProperties: ItemProperties = {};

			for (const [key, value] of Object.entries(newProperties)) {
				adaptedNewProperties[key] = value.property;
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
				await api.nodes.actions.patchNodesAndUpdateApplication(patchNodes);
			}
			if (patchRelations.length) {
				await api.relations.actions.patchRelationsAndUpdateApplication(patchRelations);
			}

			useContextMenuStore.getState().close();
		}
	};

	const onPropertyChange = (key: ItemPropertyKey, updatedProperty: ItemProperty) => {
		const newPropertiesClone = clone(newProperties);

		if (newPropertiesClone[key]) {
			newPropertiesClone[key].property = updatedProperty;
			setNewProperties(newPropertiesClone);
		}
	};

	const handlePropertyDelete = (key: ItemPropertyKey) => {
		const newPropertiesClone = clone(newProperties);

		delete newPropertiesClone[key];
		setNewProperties(newPropertiesClone);
	};

	const propertyKeys = Object.keys(newProperties);
	const hasNewProperties = propertyKeys.length > 0;
	const applyButtonText = i18n.t('context_menu__add_properties_action_apply_button');

	const tableEntries: Array<ItemPropertiesTableEntryWithTopFlag> = propertyKeys.map(
		(propertyKey) => {
			const entry = newProperties[propertyKey];

			return [entry.property, propertyKey, entry.node as Node, false];
		}
	);

	return (
		<ContextMenuSubMenu className="context-menu__paste-properties-action">
			<ContextMenuTopBlock closeSubMenuFunction={goBack} />

			<AddNewProperty
				onPropertyCreate={onPropertyCreate}
				handleRef={addNewPropertyHandleRef}
			/>
			{hasNewProperties && (
				<ItemPropertiesTable
					entries={tableEntries}
					areTopEntriesMissingProperties={false}
					onPropertyChange={onPropertyChange}
					onPropertyDelete={handlePropertyDelete}
					isEditMode={true}
					shouldIgnoreMenuPositionFix={false}
				/>
			)}
			<DBButton onClick={patchItems} variant="brand">
				{applyButtonText}
			</DBButton>
		</ContextMenuSubMenu>
	);
};
