import { DBInfotext, DBInput } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, FocusEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { itemPropertyDefaults } from 'src/utils/helpers/items';
import { html5DurationPlaceholder } from 'src/utils/helpers/placeholders';
import { html5DurationRegex } from 'src/utils/helpers/regex';
import { ItemPropertyWidgetDurationProps } from './ItemPropertyWidgetDuration.interfaces';

export const ItemPropertyWidgetDuration = ({
	isEditMode,
	onChange,
	defaultValue,
	value,
	id,
	className,
	testId
}: ItemPropertyWidgetDurationProps) => {
	const { t } = useTranslation();
	const propertyDefaultValueRef = useRef(itemPropertyDefaults['duration']().value);
	const [localValue, setLocalValue] = useState(
		defaultValue || value || propertyDefaultValueRef.current
	);
	const rootElementClassName = clsx('item-property-widget-duration', className);
	const isControlled = value !== undefined;
	const displayValue = isControlled ? value : localValue;

	const localOnChange = async (event: ChangeEvent<HTMLInputElement>) => {
		const newValue = event.target.value.trim();

		setLocalValue(newValue);

		if (onChange) {
			onChange(
				html5DurationRegex.test(newValue) ? newValue : propertyDefaultValueRef.current
			);
		}
	};

	const onBlur = (event: FocusEvent<HTMLInputElement>) => {
		if (event.target.value.trim() === '') {
			setLocalValue(propertyDefaultValueRef.current);
		}
	};

	const isValid = html5DurationRegex.test(displayValue);

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{!isEditMode && displayValue}
			{isEditMode && (
				<DBInput
					type="text"
					value={displayValue}
					label={t('item_property_widget_duration_label')}
					onChange={localOnChange}
					onBlur={onBlur}
					placeholder={html5DurationPlaceholder}
					validation="no-validation"
				/>
			)}
			{!isValid && (
				<DBInfotext
					semantic="warning"
					text={t('item_property_widget_duration_invalid_message', {
						context: displayValue ? 'with_value' : undefined,
						value: displayValue
					})}
				/>
			)}
		</div>
	);
};
