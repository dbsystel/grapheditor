import { DBInfotext, DBInput } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ItemPropertyWidgetTimezoneOffset } from 'src/components/item-property-widget/timezone-offset/ItemPropertyWidgetTimezoneOffset';
import { ItemPropertyWidgetTimezoneOffsetState } from 'src/components/item-property-widget/timezone-offset/ItemPropertyWidgetTimezoneOffset.interfaces';
import { getTimeFromString, isTime } from 'src/utils/helpers/general';
import { itemPropertyDefaults } from 'src/utils/helpers/items';
import {
	ItemPropertyWidgetTimeProps,
	ItemPropertyWidgetTimeState
} from './ItemPropertyWidgetTime.interfaces';

export const ItemPropertyWidgetTime = ({
	isEditMode,
	onChange,
	defaultValue,
	value,
	id,
	className,
	testId
}: ItemPropertyWidgetTimeProps) => {
	const timeString = defaultValue || value || itemPropertyDefaults['time']().value;
	const matches = getTimeFromString(timeString);
	const { t } = useTranslation();
	const [localValue, setLocalValue] = useState<ItemPropertyWidgetTimeState>({
		time: matches?.time || '',
		fractionOfSecond: matches?.fractionOfSecond || '',
		timezoneOffsetSign: matches?.timezoneOffsetSign || '+',
		timezoneOffset: matches?.timezoneOffset || '00:00'
	});
	const rootElementClassName = clsx('item-property-widget-time', className);
	const isControlled = value !== undefined;
	const displayValue = isControlled
		? {
				time: matches?.time || '',
				fractionOfSecond: matches?.fractionOfSecond || '',
				timezoneOffsetSign: matches?.timezoneOffsetSign || '+',
				timezoneOffset: matches?.timezoneOffset || '00:00'
			}
		: localValue;

	const localOnChange = (event: ChangeEvent<HTMLInputElement>) => {
		triggerStateUpdateAndOnChange({
			...displayValue,
			time: event.target.value
		});
	};

	const onOffsetChange = (newOffsetState: ItemPropertyWidgetTimezoneOffsetState) => {
		const newState = {
			...displayValue,
			timezoneOffsetSign: newOffsetState.sign,
			timezoneOffset: newOffsetState.time
		};

		triggerStateUpdateAndOnChange(newState);
	};

	const triggerStateUpdateAndOnChange = (newState: ItemPropertyWidgetTimeState) => {
		setLocalValue(newState);

		if (onChange) {
			const newDatetime = formatTimeString(newState);

			onChange(newDatetime);
		}
	};

	const isValid = isTime(formatTimeString(displayValue));

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{!isEditMode && formatTimeString(displayValue)}
			{isEditMode && (
				<>
					<DBInput
						type="time"
						value={displayValue.time}
						label={t('item_property_widget_time_label')}
						onChange={localOnChange}
						validation="no-validation"
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
			{!isValid && (
				<DBInfotext
					semantic="warning"
					text={t('item_property_widget_time_invalid_message', {
						// show the raw, unparsed value (same source as the view-mode display above)
						// so even completely unparseable backend data is still shown to the user,
						// instead of the reconstructed-from-parts value which can collapse to ''
						context: timeString ? 'with_value' : undefined,
						value: timeString
					})}
				/>
			)}
		</div>
	);
};

const formatTimeString = (state: ItemPropertyWidgetTimeState) => {
	let newTime = state.time;

	if (state.fractionOfSecond) {
		newTime += `.${state.fractionOfSecond}`;
	}

	if (state.timezoneOffsetSign && state.timezoneOffset) {
		newTime += `${state.timezoneOffsetSign}${state.timezoneOffset}`;
	}

	return newTime;
};
