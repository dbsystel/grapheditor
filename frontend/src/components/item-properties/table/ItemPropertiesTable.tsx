import './ItemPropertiesTable.scss';
import clsx from 'clsx';
import { ChangeEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ItemInfo } from 'src/components/item-info/ItemInfo';
import {
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
import { useNotificationsStore } from 'src/stores/notifications';
import { ITEM_PROPERTY_TYPES } from 'src/utils/constants';
import { patch } from 'src/utils/fetch/patch';
import { getItemEndpoint } from 'src/utils/helpers/items';
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
	onPropertyEdit,
	onPropertyRowMouseEnter,
	onPropertyRowMouseLeave,
	onPropertyDelete,
	onPropertyTypeChange
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
							onPropertyEdit={onPropertyEdit}
							onPropertyDelete={onPropertyDelete}
							onPropertyTypeChange={onPropertyTypeChange}
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
	onPropertyEdit,
	onPropertyDelete,
	onPropertyTypeChange,
	onMouseEnter,
	onMouseLeave
}: {
	entry: ItemPropertiesTableEntryWithTopFlag;
	onPropertyEdit: ItemPropertiesTableProps['onPropertyEdit'];
	onPropertyDelete: ItemPropertiesTableProps['onPropertyDelete'];
	onPropertyTypeChange: ItemPropertiesTableProps['onPropertyTypeChange'];
	onMouseEnter: () => void;
	onMouseLeave: () => void;
}) => {
	const { t } = useTranslation();
	const getNodeAsync = useItemsStore((store) => store.getNodeAsync);
	const addNotification = useNotificationsStore((store) => store.addNotification);
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

			const propertiesClone = window.structuredClone(item.properties);

			propertiesClone[itemProperty.key] = {
				value: parsedValue,
				type: itemProperty.type,
				edit: true // this key will probably be removed in the future
			};

			const patchResponse = await patch<Item>(getItemEndpoint(item), {
				properties: propertiesClone
			});
			const updatedPropertyNode = await getNodeAsync(itemProperty.key, true);

			if (onPropertyEdit) {
				onPropertyEdit(
					patchResponse.data,
					{
						...patchResponse.data.properties[itemProperty.key],
						key: itemProperty.key
					},
					updatedPropertyNode
				);
			}

			addNotification({
				title: t('notifications_success_property_mode', {
					mode: t('notifications_suffix_edit')
				}),
				type: 'successful'
			});

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
							onClick: () => onPropertyDelete(item, property),
							icon: 'bin'
						},
						{
							title: t('item-properties-table-change-data-type'),
							options: ITEM_PROPERTY_TYPES.map((type) => {
								return {
									title: type,
									onClick: () => onPropertyTypeChange(item, property, type),
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
