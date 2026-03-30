import { DBInput } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, FocusEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { preventCursorJumptToEnd } from 'src/utils/helpers/browser';
import { getFormattedFloat } from 'src/utils/helpers/general';
import { itemPropertyDefaults } from 'src/utils/helpers/items';
import { html5FloatPlaceholder } from 'src/utils/helpers/placeholders';
import { html5IntegerAndFloatRegex } from 'src/utils/helpers/regex';
import { ItemPropertyWidgetFloatProps } from './ItemPropertyWidgetFloat.interfaces';

const allowedStartCharacters = ['-', ',', '.'];

/**
 * Component for rendering and editing a float item property.
 * Decimal delimiter in GUI can be either dot or comma, but value is always stored with dot delimiter.
 */
export const ItemPropertyWidgetFloat = ({
	defaultValue,
	value,
	onChange,
	className,
	label,
	id,
	testId,
	isEditMode
}: ItemPropertyWidgetFloatProps) => {
	const { t } = useTranslation();
	// working with string value to allow partial inputs like "12." or "-0." or ""
	const propertyDefaultValueRef = useRef(itemPropertyDefaults['float']().value);
	const [localValue, setLocalValue] = useState(
		String(defaultValue || value || propertyDefaultValueRef.current)
	);
	const forceLocalValueRef = useRef(false);
	const rootElementClassName = clsx('item-property-widget-float', className);
	const isControlled = value !== undefined;
	const displayValue = forceLocalValueRef.current || !isControlled ? localValue : String(value);

	// immidiately reset forceLocalValueRef after using it to determine displayValue
	if (forceLocalValueRef.current) {
		forceLocalValueRef.current = false;
	}

	const localOnChange = async (event: ChangeEvent<HTMLInputElement>) => {
		let newValue = event.target.value.trim();

		// allow specific first characters but prevent invalid characters
		if (
			newValue &&
			// don't validate the first character of newValue because we want to validate characters
			// and length of the whole newValue string, otherwise we will have to to do it separately
			!allowedStartCharacters.includes(newValue) &&
			!html5IntegerAndFloatRegex.test(newValue)
		) {
			await preventCursorJumptToEnd(event);

			return;
		}

		const standardizedValue = getFormattedFloat(newValue);
		let parsedValue = parseFloat(standardizedValue);

		// switch to default value if input is empty or invalid
		if (isNaN(parsedValue)) {
			parsedValue = propertyDefaultValueRef.current;
			newValue = String(propertyDefaultValueRef.current);
		}

		if (isControlled) {
			// if the last character is not a digit, it means that user is still typing a decimal number and we shouldn't
			// call onChange with parsedValue yet, because it will update the value and consequently the input will lose
			// non-digit characters at the end (like "." or ",")
			if (!/\d$/.test(newValue)) {
				forceLocalValueRef.current = true;
				setLocalValue(newValue);
			} else if (onChange) {
				onChange(parsedValue);
			}
		} else {
			updateLocalValue(newValue);

			if (onChange) {
				onChange(parsedValue);
			}
		}
	};

	const onBlur = (event: FocusEvent<HTMLInputElement>) => {
		if (event.target.value.trim() === '') {
			updateLocalValue(String(propertyDefaultValueRef.current));
		}
	};

	const updateLocalValue = (newValue: string) => {
		if (!isControlled) {
			setLocalValue(newValue);
		}
	};

	const inputLabel = label || t('item_property_widget_float_label');

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{!isEditMode && displayValue}
			{isEditMode && (
				<DBInput
					type="text"
					inputMode="decimal"
					value={displayValue}
					label={inputLabel}
					onChange={localOnChange}
					onBlur={onBlur}
					placeholder={html5FloatPlaceholder}
				/>
			)}
		</div>
	);
};
