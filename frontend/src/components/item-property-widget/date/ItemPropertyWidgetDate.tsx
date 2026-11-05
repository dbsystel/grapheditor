import { DBInfotext, DBInput } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getFormattedLocaleDatetimeString, isDate } from 'src/utils/helpers/general';
import { itemPropertyDefaults } from 'src/utils/helpers/items';
import { ItemPropertyWidgetDateProps } from './ItemPropertyWidgetDate.interfaces';

export const ItemPropertyWidgetDate = ({
	isEditMode,
	onChange,
	defaultValue,
	value,
	id,
	className,
	testId
}: ItemPropertyWidgetDateProps) => {
	const { t } = useTranslation();
	const [localValue, setLocalValue] = useState(
		defaultValue || value || itemPropertyDefaults['date']().value
	);
	const rootElementClassName = clsx('item-property-widget-date', className);
	const isControlled = value !== undefined;
	const displayValue = isControlled ? value : localValue;

	const localOnChange = (event: ChangeEvent<HTMLInputElement>) => {
		const newValue = event.target.value;

		setLocalValue(newValue);

		if (onChange) {
			onChange(newValue);
		}
	};

	const isValid = isDate(displayValue);

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{!isEditMode && getFormattedLocaleDatetimeString(displayValue)}
			{isEditMode && (
				<DBInput
					type="date"
					value={displayValue}
					label={t('item_property_widget_date_label')}
					onChange={localOnChange}
					validation="no-validation"
				/>
			)}
			{!isValid && (
				<DBInfotext
					semantic="warning"
					text={t('item_property_widget_date_invalid_message', {
						context: displayValue ? 'with_value' : undefined,
						value: displayValue
					})}
				/>
			)}
		</div>
	);
};
