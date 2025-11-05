import { DBButton, DBCard, DBCheckbox } from '@db-ux/react-core-components';
import { useState } from 'react';
import { ContextMenuSubMenu } from 'src/components/context-menu/sub-menu/ContextMenuSubMenu';
import { ContextMenuTopBlock } from 'src/components/context-menu/sub-menu/top-block/ContextMenuTopBlock';
import { ItemInfo } from 'src/components/item-info/ItemInfo';
import { Table } from 'src/components/table/Table';
import { TableBody } from 'src/components/table-body/TableBody';
import { TableCell } from 'src/components/table-cell/TableCell';
import { TableHead } from 'src/components/table-head/TableHead';
import { TableRow } from 'src/components/table-row/TableRow';
import i18n from 'src/i18n';
import {
	ItemPropertyKey,
	ItemPropertyType,
	ItemPropertyValue,
	ItemPropertyWithKey
} from 'src/models/item';
import { NodeId, PatchNode } from 'src/models/node';
import { RelationId } from 'src/models/relation';
import { useClipboardStore } from 'src/stores/clipboard';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useItemsStore } from 'src/stores/items';
import { nodesApi } from 'src/utils/api/nodes';
import { relationsApi } from 'src/utils/api/relations';
import { clone } from 'src/utils/helpers/general';
import { isNode } from 'src/utils/helpers/nodes';
import { idFormatter } from 'src/utils/idFormatter';

// list of properties
export const PastePropertiesAction = ({
	pasteToId,
	goBack
}: {
	pasteToId: NodeId | RelationId;
	goBack: () => void;
}) => {
	const [selectedProperties, setSelectedProperties] = useState<
		Record<
			ItemPropertyKey,
			{
				itemId: NodeId | RelationId;
				property: {
					key: ItemPropertyKey;
					value: ItemPropertyValue;
					type: ItemPropertyType;
				};
			}
		>
	>({});
	const copiedNodes = useClipboardStore.getState().getAvailableNodes();
	const copiedRelations = useClipboardStore.getState().getAvailableRelations();

	const handleCheckboxChange = (
		itemId: NodeId | RelationId,
		property: Omit<ItemPropertyWithKey, 'edit'>,
		isChecked: boolean
	) => {
		const selectedPropertiesClone = clone(selectedProperties);

		if (isChecked) {
			selectedPropertiesClone[property.key] = {
				itemId: itemId,
				property: {
					key: property.key,
					value: property.value,
					type: property.type
				}
			};
		} else {
			delete selectedPropertiesClone[property.key];
		}

		setSelectedProperties(selectedPropertiesClone);
	};

	const patchItem = async () => {
		if (window.confirm(i18n.t('context_menu__paste_properties_action_overwrite_warning'))) {
			const pasteTo = useItemsStore.getState().getStoreItem(pasteToId);

			if (pasteTo) {
				const patchNode: PatchNode = {
					id: pasteTo.id,
					properties: clone(pasteTo.properties)
				};

				Object.values(selectedProperties).forEach(({ property }) => {
					patchNode.properties[property.key] = {
						type: property.type,
						value: property.value,
						edit: true
					};
				});

				const patchApi = isNode(pasteTo)
					? nodesApi.patchNodesAndUpdateApplication.bind(null, [patchNode])
					: relationsApi.patchRelationsAndUpdateApplication.bind(null, [patchNode]);

				useContextMenuStore.getState().setIsActionLoading(true);

				await patchApi();

				useContextMenuStore.getState().close();
			}
		}
	};

	const applyButtonText = i18n.t('context_menu__paste_properties_action_apply_button');
	const propertyKeyHeading = i18n.t('form_property_key');
	const propertyValueHeading = i18n.t('form_property_value');
	const propertyTypeHeading = i18n.t('form_property_type');
	const isApplyButtonDisabled = Object.keys(selectedProperties).length === 0;
	const copiedItems = [...copiedNodes, ...copiedRelations];

	return (
		<ContextMenuSubMenu className="context-menu__paste-properties-action">
			<ContextMenuTopBlock closeSubMenuFunction={goBack} />
			<div className="context-menu__expanded-content">
				{copiedItems.map((copiedItem) => {
					const propertyKeys = Object.keys(copiedItem.properties);

					return (
						<DBCard key={copiedItem.id}>
							<div>
								<ItemInfo item={copiedItem} />
							</div>
							<Table>
								<TableHead>
									<TableRow>
										<TableCell />
										<TableCell>{propertyKeyHeading}</TableCell>
										<TableCell width="full">{propertyValueHeading}</TableCell>
										<TableCell>{propertyTypeHeading}</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{propertyKeys.map((propertyKey) => {
										const property = copiedItem.properties[propertyKey];
										const isDisabled =
											selectedProperties[propertyKey] &&
											selectedProperties[propertyKey].itemId !==
												copiedItem.id;

										return (
											<TableRow key={copiedItem.id + propertyKey}>
												<TableCell>
													<DBCheckbox
														onChange={(event) =>
															handleCheckboxChange(
																copiedItem.id,
																{
																	key: propertyKey,
																	value: property.value,
																	type: property.type
																},
																event.target.checked
															)
														}
														disabled={isDisabled}
														style={
															isDisabled
																? { opacity: 0.5 }
																: undefined
														}
													/>
												</TableCell>
												<TableCell>
													{idFormatter.parseIdToName(propertyKey)}
												</TableCell>
												<TableCell>{property.value}</TableCell>
												<TableCell>{property.type}</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</DBCard>
					);
				})}
			</div>
			<DBButton onClick={patchItem} disabled={isApplyButtonDisabled} variant="brand">
				{applyButtonText}
			</DBButton>
		</ContextMenuSubMenu>
	);
};
