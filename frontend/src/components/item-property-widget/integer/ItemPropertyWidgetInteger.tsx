import { DBInput } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, FocusEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { preventCursorJumptToEnd } from 'src/utils/helpers/browser';
import { itemPropertyDefaults } from 'src/utils/helpers/items';
import { html5FIntegerPlaceholder } from 'src/utils/helpers/placeholders';
import { html5IntegerRegex } from 'src/utils/helpers/regex';
import { ItemPropertyWidgetIntegerProps } from './ItemPropertyWidgetInteger.interfaces';

export const ItemPropertyWidgetInteger = ({
	isEditMode,
	onChange,
	defaultValue,
	value,
	id,
	className,
	testId
}: ItemPropertyWidgetIntegerProps) => {
	const { t } = useTranslation();
	const propertyDefaultValueRef = useRef(itemPropertyDefaults['integer']().value);
	// working with string value to allow clearing the input
	const [localValue, setLocalValue] = useState(
		String(defaultValue || value || propertyDefaultValueRef.current)
	);
	const rootElementClassName = clsx('item-property-widget-integer', className);
	const isControlled = value !== undefined;
	const displayValue = isControlled ? String(value) : localValue;

	// using FormEvent instead of ChangeEvent to capture input events as they happen (when typing comma,
	// the onChange event is not fired in some browsers)
	const localOnChange = async (event: ChangeEvent<HTMLInputElement>) => {
		const newValue = event.target.value.trim();

		// allow empty input but prevent invalid characters
		if (newValue && !html5IntegerRegex.test(newValue)) {
			await preventCursorJumptToEnd(event);

			return;
		}

		let parsedValue = parseFloat(newValue);

		// switch to default value if input is empty or invalid
		if (isNaN(parsedValue)) {
			parsedValue = propertyDefaultValueRef.current;
		}

		updateLocalValue(newValue);

		if (onChange) {
			onChange(parsedValue);
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

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{!isEditMode && displayValue}
			{isEditMode && (
				<DBInput
					// if we use type="number", it allows a decimal point or a comma in some browsers
					// (e.g. Chrome) but comma is not existing in event.target.value, which leads to confusion
					// and impossible parsing
					type="text"
					inputmode="numeric"
					value={displayValue}
					label={t('item_property_widget_integer_label')}
					onChange={localOnChange}
					onBlur={onBlur}
					placeholder={html5FIntegerPlaceholder}
				/>
			)}
		</div>
	);
};
