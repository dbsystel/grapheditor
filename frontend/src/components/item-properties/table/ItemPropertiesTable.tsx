import './ItemPropertiesTable.scss';
import clsx from 'clsx';
import { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ItemInfo } from 'src/components/item-info/ItemInfo';
import { ItemPropertiesEditPropertyValue } from 'src/components/item-properties/table/edit-property-value/ItemPropertiesEditPropertyValue';
import { MenuButton } from 'src/components/menu-button/MenuButton';
import { MenuButtonOption } from 'src/components/menu-button/MenuButton.interfaces';
import { Table } from 'src/components/table/Table';
import { TableBody } from 'src/components/table-body/TableBody';
import { TableCell } from 'src/components/table-cell/TableCell';
import { TableRow } from 'src/components/table-row/TableRow';
import { ITEM_PROPERTY_TYPES } from 'src/utils/constants';
import {
	ItemPropertiesTableEntryWithTopFlag,
	ItemPropertiesTableProps
} from './ItemPropertiesTable.interfaces';

export const ItemPropertiesTable = ({
	entries,
	topEntries,
	areTopEntriesMissingProperties,
	id,
	className,
	testId,
	onPropertyRowMouseEnter,
	onPropertyRowMouseLeave,
	onPropertyChange,
	onPropertyDelete,
	isEditMode
}: ItemPropertiesTableProps) => {
	const { t } = useTranslation();
	const rootElementClassName = clsx('item-properties-table', className);
	const flatArrayProperties: Array<ItemPropertiesTableEntryWithTopFlag> = [];

	entries.forEach(([property, propertyNode]) => {
		flatArrayProperties.push([property, propertyNode, false]);
	});

	flatArrayProperties.sort((a, b) => {
		const aNodeTitle = a[1].title.toLowerCase();
		const bNodeTitle = b[1].title.toLowerCase();

		return aNodeTitle.localeCompare(bNodeTitle);
	});

	topEntries?.forEach(([property, propertyNode]) => {
		flatArrayProperties.unshift([property, propertyNode, true]);
	});

	const localOnPropertyRowMouseInteraction = (
		interactionType: 'enter' | 'leave',
		entry: ItemPropertiesTableEntryWithTopFlag
	) => {
		const propCallback =
			interactionType === 'enter' ? onPropertyRowMouseEnter : onPropertyRowMouseLeave;

		if (propCallback) {
			propCallback(entry[0], entry[1]);
		}
	};

	return (
		<Table id={id} className={rootElementClassName} width="full" testId={testId}>
			<TableBody>
				{flatArrayProperties.map((entry, index) => {
					const [property, propertyNode, isTopEntry] = entry;
					const isMissingProperty = isTopEntry && areTopEntriesMissingProperties;

					const onMouseEnter = () => {
						localOnPropertyRowMouseInteraction('enter', entry);
					};

					const onMouseLeave = () => {
						localOnPropertyRowMouseInteraction('leave', entry);
					};

					const localPropertyDeleteHandle = () => {
						onPropertyDelete(entry[0].key);
					};

					const localOnPropertyChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
						onPropertyChange(entry[0].key, event.target.value);
					};

					const tableRowStyle = {
						backgroundColor: isTopEntry ? 'rgb(243, 243, 245)' : undefined
					};

					const menuOptions: Array<MenuButtonOption> = [
						{
							title: t('item-properties-table-delete-property'),
							onClick: localPropertyDeleteHandle,
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
					];

					return (
						<TableRow
							style={tableRowStyle}
							key={index + property.key}
							onMouseEnter={onMouseEnter}
							onMouseLeave={onMouseLeave}
							variant="hoverable"
						>
							<TableCell width="full" className="item-properties-table__cell">
								<ItemInfo item={propertyNode} />
							</TableCell>
							<TableCell
								width="full"
								className="item-properties-table__cell item-properties-table__textarea"
							>
								<ItemPropertiesEditPropertyValue
									property={property}
									onChange={localOnPropertyChange}
									isEditMode={isEditMode}
								/>
							</TableCell>
							<TableCell
								width="minimal"
								className="item-properties-table__cell item-properties-table__menu"
							>
								{isEditMode && !isMissingProperty && (
									<MenuButton
										className="item-properties-table__menu-button"
										optionsPlacement="bottom-end"
										options={menuOptions}
									/>
								)}
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
};
