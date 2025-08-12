import './ItemPropertiesTable.scss';
import clsx from 'clsx';
import { ChangeEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ItemInfo } from 'src/components/item-info/ItemInfo';
import {
	deleteProperty,
	parsePropertyValue,
	showNotificationForPropertyTypeAndValueMismatch
} from 'src/components/item-properties/helpers';
import { ItemPropertiesEditPropertyValue } from 'src/components/item-properties/table/edit-property-value/ItemPropertiesEditPropertyValue';
import { MenuButton } from 'src/components/menu-button/MenuButton';
import { Table } from 'src/components/table/Table';
import { TableBody } from 'src/components/table-body/TableBody';
import { TableCell } from 'src/components/table-cell/TableCell';
import { TableRow } from 'src/components/table-row/TableRow';
import { Item, ItemPropertyWithKey } from 'src/models/item';
import { useItemsStore } from 'src/stores/items';
import { nodesApi } from 'src/utils/api/nodes';
import { relationsApi } from 'src/utils/api/relations';
import { ITEM_PROPERTY_TYPES } from 'src/utils/constants';
import { isNode } from 'src/utils/helpers/nodes';
import { isRelation } from 'src/utils/helpers/relations';
import {
	ItemPropertiesTableEntryWithTopFlag,
	ItemPropertiesTableProps
} from './ItemPropertiesTable.interfaces';

export const ItemPropertiesTable = ({
	entries,
	topEntries,
	id,
	className,
	testId,
	onPropertyRowMouseEnter,
	onPropertyRowMouseLeave
}: ItemPropertiesTableProps) => {
	const rootElementClassName = clsx('item-properties-table', className);
	const flatArrayProperties: Array<ItemPropertiesTableEntryWithTopFlag> = [];

	entries.forEach(([item, property, propertyNode]) => {
		flatArrayProperties.push([item, property, propertyNode, false]);
	});

	flatArrayProperties.sort((a, b) => {
		const aNodeTitle = a[2].title.toLowerCase();
		const bNodeTitle = b[2].title.toLowerCase();

		return aNodeTitle.localeCompare(bNodeTitle);
	});

	topEntries?.forEach(([item, property, propertyNode]) => {
		flatArrayProperties.unshift([item, property, propertyNode, true]);
	});

	const localOnPropertyRowMouseInteraction = (
		interactionType: 'enter' | 'leave',
		entry: ItemPropertiesTableEntryWithTopFlag
	) => {
		const propCallback =
			interactionType === 'enter' ? onPropertyRowMouseEnter : onPropertyRowMouseLeave;

		if (propCallback) {
			propCallback(entry[0], entry[1], entry[2]);
		}
	};

	return (
		<Table id={id} className={rootElementClassName} width="full" testId={testId}>
			<TableBody>
				{flatArrayProperties.map((entry) => {
					return (
						<ItemPropertiesTableRow
							key={entry[2].id}
							entry={entry}
							onMouseEnter={() => {
								localOnPropertyRowMouseInteraction('enter', entry);
							}}
							onMouseLeave={() => {
								localOnPropertyRowMouseInteraction('leave', entry);
							}}
						/>
					);
				})}
			</TableBody>
		</Table>
	);
};

const ItemPropertiesTableRow = ({
	entry: [item, property, propertyNode, isTopEntry],
	onMouseEnter,
	onMouseLeave
}: {
	entry: ItemPropertiesTableEntryWithTopFlag;
	onMouseEnter: () => void;
	onMouseLeave: () => void;
}) => {
	const { t } = useTranslation();
	const getNodeAsync = useItemsStore((store) => store.getNodeAsync);
	const [isLoading, setIsLoading] = useState(false);
	// the input field is a text field, meaning we will be working with strings
	const propertyValueRef = useRef(property.value.toString());

	const onPropertyChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		propertyValueRef.current = event.target.value;
	};

	const onPropertySave = async (item: Item, itemProperty: ItemPropertyWithKey) => {
		if (!isLoading) {
			const value = propertyValueRef.current;
			const trimmedValue = value.trim();
			const parsedValue = parsePropertyValue(itemProperty.type, trimmedValue);

			if (parsedValue === null) {
				showNotificationForPropertyTypeAndValueMismatch();
				return;
			}

			setIsLoading(true);

			const itemClone = window.structuredClone(item);

			itemClone.properties[itemProperty.key] = {
				value: parsedValue,
				type: itemProperty.type,
				edit: true // this key will probably be removed in the future
			};

			await getNodeAsync(itemProperty.key, true);

			const patchObject = {
				id: item.id,
				properties: itemClone.properties
			};

			if (isNode(item)) {
				nodesApi.patchNodesAndUpdateApplication([patchObject]);
			} else if (isRelation(item)) {
				relationsApi.patchRelationsAndUpdateApplication([patchObject]);
			}

			setIsLoading(false);
		}
	};

	return (
		<TableRow
			style={{
				backgroundColor: isTopEntry ? 'rgb(243, 243, 245)' : undefined,
				opacity: isLoading ? 0.4 : undefined,
				pointerEvents: isLoading ? 'none' : undefined
			}}
			key={item.id + property.key}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			className="item-properties-table__hoverable-row"
		>
			<TableCell width="full" className="item-properties-table__cell">
				<ItemInfo item={propertyNode} />
			</TableCell>
			<TableCell
				width="full"
				className="item-properties-table__cell item-properties-table__textarea"
			>
				<ItemPropertiesEditPropertyValue
					item={item}
					property={property}
					onChange={onPropertyChange}
				/>
			</TableCell>
			<TableCell
				width="minimal"
				className="item-properties-table__cell item-properties-table__menu"
			>
				<MenuButton
					className="item-properties-table__menu-button"
					optionsPlacement="bottom-end"
					options={[
						{
							title: t('item-properties-table-save-property'),
							onClick: () => onPropertySave(item, property),
							icon: 'save'
						},
						{
							title: t('item-properties-table-delete-property'),
							onClick: () => deleteProperty(item, property.key),
							icon: 'bin'
						},
						{
							title: t('item-properties-table-change-data-type'),
							options: ITEM_PROPERTY_TYPES.map((type) => {
								return {
									title: type,
									icon: property.type === type ? 'check' : '',
									isDisabled: true
								};
							}),
							optionsPlacement: 'bottom-end'
						}
					]}
				/>
			</TableCell>
		</TableRow>
	);
};
