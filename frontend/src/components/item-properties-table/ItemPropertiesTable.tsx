import './ItemPropertiesTable.scss';
import { DBIcon, DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { ItemInfo } from 'src/components/item-info/ItemInfo';
import { ItemPropertyValue } from 'src/components/item-property-value/ItemPropertyValue';
import { MenuButton } from 'src/components/menu-button/MenuButton';
import { MenuButtonOption } from 'src/components/menu-button/MenuButton.interfaces';
import { Table } from 'src/components/table/Table';
import { TableBody } from 'src/components/table-body/TableBody';
import { TableCell } from 'src/components/table-cell/TableCell';
import { TableRow } from 'src/components/table-row/TableRow';
import { ItemProperty } from 'src/models/item';
import { ITEM_PROPERTY_TYPE_OPTIONS_FLAT } from 'src/utils/constants';
import { isString } from 'src/utils/helpers/general';
import { isItemPropertyOfValidShapeList } from 'src/utils/helpers/items';
import { ItemPropertiesTableProps } from './ItemPropertiesTable.interfaces';

export const ItemPropertiesTable = ({
	entries,
	areTopEntriesMissingProperties,
	propertyKeyPrefix,
	onPropertyRowMouseEnter,
	onPropertyRowMouseLeave,
	onPropertyChange,
	handlePropertyDelete,
	handlePropertyTypeChange,
	isEditMode,
	id,
	className,
	testId
}: ItemPropertiesTableProps) => {
	const { t } = useTranslation();
	const rootElementClassName = clsx(
		'item-properties-table',
		{
			'item-properties-table--edit-mode': isEditMode
		},
		className
	);

	return (
		<Table id={id} className={rootElementClassName} width="full" testId={testId}>
			<TableBody>
				{entries.map((entry, index) => {
					const [property, key, propertyNode, isTopEntry] = entry;
					const isMissingProperty = isTopEntry && areTopEntriesMissingProperties;
					const isItemPropertyListEmpty =
						isItemPropertyOfValidShapeList(property) && property.value.length === 0;
					const itemPropertyValueKey = propertyKeyPrefix
						? `${propertyKeyPrefix}-${key}`
						: key;

					const onMouseEnter = () => {
						if (onPropertyRowMouseEnter) {
							onPropertyRowMouseEnter(entry);
						}
					};

					const onMouseLeave = () => {
						if (onPropertyRowMouseLeave) {
							onPropertyRowMouseLeave(entry);
						}
					};

					const localPropertyDeleteHandle = () => {
						handlePropertyDelete(key);
					};

					// newType is string because it can be list_<type> (easier to handle that way)
					const localPropertyTypeChangeHandle = (newType: string) => {
						if (handlePropertyTypeChange) {
							handlePropertyTypeChange(key, newType);
						}
					};

					const localOnPropertyChange = (
						updatedProperty: ItemProperty,
						index?: number
					) => {
						onPropertyChange(key, updatedProperty, index);
					};

					const menuOptions: Array<MenuButtonOption> = [
						{
							title: t('item_properties_table_delete_property'),
							onClick: localPropertyDeleteHandle,
							icon: 'bin',
							closeMenuOnClick: true
						},
						{
							title: t('item_properties_table_change_data_type'),
							options: ITEM_PROPERTY_TYPE_OPTIONS_FLAT.map((option) => {
								return {
									title: option.value,
									icon: property.type === option.value ? 'check' : '',
									onClick: () => {
										if (isString(option.value)) {
											localPropertyTypeChangeHandle(option.value);
										}
									},
									optionsPlacement: 'bottom-end',
									closeMenuOnClick: true
								};
							}),
							optionsPlacement: 'bottom-end'
						}
					];

					const rowClassName = clsx({
						'item-properties-table__top-row': isTopEntry
					});

					return (
						<TableRow
							className={rowClassName}
							key={index + key}
							onMouseEnter={onMouseEnter}
							onMouseLeave={onMouseLeave}
							variant="hoverable"
						>
							<TableCell width="auto" className="item-properties-table__cell">
								<div className="item-properties-table__cell-content">
									{isItemPropertyListEmpty && (
										<div>
											<DBIcon
												data-color="informational"
												icon="exclamation_mark_circle"
												className="item-properties-table__warning-icon"
											/>
											<DBTooltip
												className="item-properties-table__warning-tooltip db-tooltip-fix db-tooltip-fix--top-start"
												width="auto"
											>
												{t('item_properties_table_empty_list')}
											</DBTooltip>
										</div>
									)}
									<ItemInfo item={propertyNode} />
								</div>
							</TableCell>
							<TableCell
								width="auto"
								className="item-properties-table__cell item-properties-table__textarea"
							>
								<ItemPropertyValue
									key={itemPropertyValueKey}
									property={property}
									onChange={localOnPropertyChange}
									isEditMode={isEditMode}
								/>
							</TableCell>
							{isEditMode && !isMissingProperty && (
								<TableCell
									width="minimal"
									className="item-properties-table__cell item-properties-table__menu"
								>
									<MenuButton
										className="item-properties-table__menu-button menu-button--ignore-position-fix menu-button--inline-end-fix"
										optionsPlacement="bottom-start"
										options={menuOptions}
									/>
								</TableCell>
							)}
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
};
