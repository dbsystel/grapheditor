import './ItemPropertyTypeDropdown.scss';
import { DBSelect } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	ITEM_PROPERTY_TYPE_OPTIONS,
	ITEM_PROPERTY_TYPE_OPTIONS_WITH_LIST_SUBTYPES,
	ITEM_PROPERTY_TYPES_MAPPED
} from 'src/utils/constants';
import {
	isItemPropertyTypeNonList,
	isItemPropertyTypeWithListSubtypes
} from 'src/utils/helpers/items';
import { ItemPropertyTypeDropdownProps } from './ItemPropertyTypeDropdown.interfaces';

export const ItemPropertyTypeDropdown = ({
	value,
	onChange,
	isDisabled,
	shouldExcludeListTypes,
	id,
	className,
	testId,
	...rest
}: ItemPropertyTypeDropdownProps) => {
	const { t } = useTranslation();
	const [localValue, setLocalValue] = useState(value || ITEM_PROPERTY_TYPES_MAPPED.string);
	const rootElementClassName = clsx('item-property-type-dropdown', className);

	const localOnChange = (event: ChangeEvent<HTMLSelectElement>) => {
		const value = event.target.value;

		if (!isItemPropertyTypeWithListSubtypes(value)) {
			return;
		}

		const newType = isItemPropertyTypeNonList(value) ? value : ITEM_PROPERTY_TYPES_MAPPED.list;
		const subType = value.startsWith('list_') ? value.slice(5) : undefined;

		setLocalValue(value);

		if (!onChange) {
			return;
		}

		if (shouldExcludeListTypes) {
			if (isItemPropertyTypeNonList(newType)) {
				onChange(newType);
			}
		} else {
			if (!subType) {
				onChange(value, newType);
			} else if (isItemPropertyTypeNonList(subType)) {
				onChange(value, newType, subType);
			}
		}
	};

	const dropdownValue = value || localValue;
	const options = shouldExcludeListTypes
		? ITEM_PROPERTY_TYPE_OPTIONS
		: ITEM_PROPERTY_TYPE_OPTIONS_WITH_LIST_SUBTYPES;

	return (
		<div className={rootElementClassName} id={id} data-testid={testId}>
			<DBSelect
				{...rest}
				value={dropdownValue}
				onChange={localOnChange}
				options={options}
				label={rest.label || t('item_property_type_drodown_label')}
				variant={rest.variant || 'floating'}
				disabled={isDisabled}
			/>
		</div>
	);
};
