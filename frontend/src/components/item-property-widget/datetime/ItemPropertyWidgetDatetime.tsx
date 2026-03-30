import { DBInput } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ItemPropertyWidgetFractionOfSecond } from 'src/components/item-property-widget/fraction-of-second/ItemPropertyWidgetFractionOfSecond';
import { ItemPropertyWidgetTimezoneOffset } from 'src/components/item-property-widget/timezone-offset/ItemPropertyWidgetTimezoneOffset';
import { ItemPropertyWidgetTimezoneOffsetState } from 'src/components/item-property-widget/timezone-offset/ItemPropertyWidgetTimezoneOffset.interfaces';
import { getDatetimeFromString, getFormattedLocaleDatetimeString } from 'src/utils/helpers/general';
import { itemPropertyDefaults } from 'src/utils/helpers/items';
import {
	ItemPropertyWidgetDatetimeProps,
	ItemPropertyWidgetDatetimeState
} from './ItemPropertyWidgetDatetime.interfaces';

export const ItemPropertyWidgetDatetime = ({
	isEditMode,
	onChange,
	defaultValue,
	value,
	id,
	className,
	testId
}: ItemPropertyWidgetDatetimeProps) => {
	const { t } = useTranslation();
	const datetimeString = defaultValue || value || itemPropertyDefaults['datetime']().value;
	const matches = getDatetimeFromString(datetimeString);
	const [localValue, setLocalValue] = useState<ItemPropertyWidgetDatetimeState>({
		datetime: matches?.datetime || '',
		fractionOfSecond: matches?.fractionOfSecond || '',
		timezoneOffsetSign: matches?.timezoneOffsetSign || '',
		timezoneOffset: matches?.timezoneOffset || ''
	});
	const rootElementClassName = clsx('item-property-widget-datetime', className);
	const isControlled = value !== undefined;
	const displayValue = isControlled
		? {
				datetime: matches?.datetime || '',
				fractionOfSecond: matches?.fractionOfSecond || '',
				timezoneOffsetSign: matches?.timezoneOffsetSign || '',
				timezoneOffset: matches?.timezoneOffset || ''
			}
		: localValue;

	const onDatetimeChange = (event: ChangeEvent<HTMLInputElement>) => {
		const newDate = event.target.value;

		event.target.reportValidity();

		triggerStateUpdateAndOnChange({
			...displayValue,
			datetime: newDate
		});
	};

	const onOffsetChange = (newOffsetState: ItemPropertyWidgetTimezoneOffsetState) => {
		triggerStateUpdateAndOnChange({
			...displayValue,
			timezoneOffsetSign: newOffsetState.sign,
			timezoneOffset: newOffsetState.time
		});
	};

	const onFractionOfSecondChange = (newFractionOfSecond: string) => {
		triggerStateUpdateAndOnChange({
			...displayValue,
			fractionOfSecond: newFractionOfSecond
		});
	};

	const triggerStateUpdateAndOnChange = (newState: ItemPropertyWidgetDatetimeState) => {
		if (!isControlled) {
			setLocalValue(newState);
		}

		if (onChange) {
			const newDatetime = formatDatetimeString(newState);

			onChange(newDatetime);
		}
	};

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{!isEditMode && getFormattedLocaleDatetimeString(datetimeString)}
			{isEditMode && (
				<>
					<DBInput
						type="datetime-local"
						value={displayValue.datetime}
						step={1}
						label={t('item_property_widget_datetime_label')}
						onChange={onDatetimeChange}
					/>
					<ItemPropertyWidgetFractionOfSecond
						defaultValue={displayValue.fractionOfSecond}
						isEditMode={isEditMode}
						onChange={onFractionOfSecondChange}
					/>
					<ItemPropertyWidgetTimezoneOffset
						defaultValue={{
							sign: displayValue.timezoneOffsetSign,
							time: displayValue.timezoneOffset
						}}
						onChange={onOffsetChange}
						isEditMode={isEditMode}
					/>
				</>
			)}
		</div>
	);
};

const formatDatetimeString = (state: ItemPropertyWidgetDatetimeState) => {
	let newDatetime = state.datetime;

	if (state.fractionOfSecond) {
		newDatetime += `.${state.fractionOfSecond}`;
	}

	if (state.timezoneOffsetSign && state.timezoneOffset) {
		newDatetime += `${state.timezoneOffsetSign}${state.timezoneOffset}`;
	}

	return newDatetime;
};
