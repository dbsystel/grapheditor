import { DBInput } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { preventCursorJumptToEnd } from 'src/utils/helpers/browser';
import { getDigitsFromString, stripTrailingZerosFromString } from 'src/utils/helpers/general';
import { ItemPropertyWidgetFractionOfSecondProps } from './ItemPropertyWidgetFractionOfSecond.interfaces';

export const ItemPropertyWidgetFractionOfSecond = ({
	isEditMode,
	onChange,
	defaultValue,
	value,
	id,
	className,
	testId
}: ItemPropertyWidgetFractionOfSecondProps) => {
	const { t } = useTranslation();
	const [localValue, setLocalValue] = useState(
		stripTrailingZerosFromString(defaultValue || value || '')
	);
	const rootElementClassName = clsx('item-property-widget-fraction-of-second', className);
	const isControlled = value !== undefined;
	const displayValue = isControlled ? value : localValue;

	const localOnChange = async (event: ChangeEvent<HTMLInputElement>) => {
		// this check is required due to React's SyntheticEvent wrapping native events
		const lastInputChar =
			event.nativeEvent instanceof InputEvent ? event.nativeEvent.data : null;

		if (lastInputChar !== null && !getDigitsFromString(lastInputChar)) {
			await preventCursorJumptToEnd(event);

			return;
		}

		const newFractionOfSecond = event.target.value.trim();

		if (newFractionOfSecond) {
			const matchNumbers = getDigitsFromString(newFractionOfSecond);
			if (!matchNumbers) {
				return;
			}

			const fractionOfSecondValue = parseInt(matchNumbers);
			if (isNaN(fractionOfSecondValue)) {
				return;
			}
		}

		triggerStateUpdateAndOnChange(newFractionOfSecond);
	};

	const triggerStateUpdateAndOnChange = (newState: string) => {
		if (!isControlled) {
			setLocalValue(newState);
		}

		if (onChange) {
			onChange(newState);
		}
	};

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{!isEditMode && String(displayValue)}
			{isEditMode && (
				<DBInput
					type="text"
					inputMode="numeric"
					value={displayValue}
					label={t('item_property_widget_fraction_of_second_label')}
					onChange={localOnChange}
				/>
			)}
		</div>
	);
};
