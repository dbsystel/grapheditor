import './ItemPropertyWidgetTimezoneOffset.scss';
import { DBIcon, DBInput, DBSelect, DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getDigitsFromString } from 'src/utils/helpers/general';
import {
	ItemPropertyWidgetTimezoneOffsetProps,
	ItemPropertyWidgetTimezoneOffsetState
} from './ItemPropertyWidgetTimezoneOffset.interfaces';

export const ItemPropertyWidgetTimezoneOffset = ({
	defaultValue,
	value,
	onChange,
	className,
	id,
	testId,
	isEditMode
}: ItemPropertyWidgetTimezoneOffsetProps) => {
	const { t } = useTranslation();
	const [localValue, setLocalValue] = useState(defaultValue || value || { sign: '', time: '' });
	const timeElementRef = useRef<HTMLInputElement>(null);
	const rootElementClassName = clsx('item-property-widget-timezone-offset', className);
	const isControlled = value !== undefined;
	const displayValue = isControlled ? value : localValue;

	useEffect(() => {
		// TODO check is still needed once https://github.com/db-ux-design-system/core-web/issues/5817 is fixed
		timeElementRef.current?.setAttribute('list', idRef.current);
	}, []);

	const onSignChange = (event: ChangeEvent<HTMLSelectElement>) => {
		const newSign = event.target.value;
		let time = displayValue.time;
		const timeAsNumber = parseInt(getDigitsFromString(time) || '0');

		if (newSign === '-' && timeAsNumber > 1200) {
			// if changing to negative sign and time is greater than 12:00, set time to 12:00
			time = '12:00';
		}

		triggerStateUpdateAndOnChange({
			time: time,
			sign: newSign
		});
	};

	const onTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
		const newTime = event.target.value;

		event.target.reportValidity();

		triggerStateUpdateAndOnChange({
			...displayValue,
			time: newTime
		});
	};

	const triggerStateUpdateAndOnChange = (newState: ItemPropertyWidgetTimezoneOffsetState) => {
		if (!isControlled) {
			setLocalValue(newState);
		}

		const isTimeValid = timeElementRef.current?.validity.valid;

		if (onChange && isTimeValid) {
			onChange(newState);
		}
	};

	// maximum positive offset: UTC+14:00 (e.g., Line Islands in Kiribati)
	// maximum negative offset: UTC−12:00 (e.g., Baker/Howland Islands time)
	const timezoneOffsetMaximum = displayValue.sign === '+' ? '14:00' : '12:00';

	const idRef = useRef(window.crypto.randomUUID());
	const offsetOptionsToRender =
		displayValue.sign === '+' ? offsetOptions : offsetOptions.slice(0, 49);

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{!isEditMode && displayValue.sign + displayValue.time}
			{isEditMode && (
				<>
					<div className="item-property-widget-timezone-offset__label">
						<div>
							<DBIcon data-color="informational" icon="exclamation_mark_circle" />
							<DBTooltip
								className="item-properties-table__warning-tooltip db-tooltip-fix db-tooltip-fix--top-start"
								width="auto"
							>
								<small>
									<ul className="item-property-widget-timezone-offset__info-list">
										<li>
											{t('item_property_widget_timezone_offset_positive')}
										</li>
										<li>
											{t('item_property_widget_timezone_offset_negative')}
										</li>
									</ul>
								</small>
							</DBTooltip>
						</div>
						<span>{t('item_property_widget_timezone_offset_label')}</span>
					</div>
					<div className="item-property-widget-timezone-offset__inputs">
						<DBSelect
							options={timezoneSignOptions}
							value={displayValue.sign}
							label=""
							showLabel={false}
							onChange={onSignChange}
						/>
						<DBInput
							ref={timeElementRef}
							type="time"
							value={displayValue.time}
							label=""
							showLabel={false}
							min="00:00"
							max={timezoneOffsetMaximum}
							onChange={onTimeChange}
							dataListId={idRef.current}
							validation="no-validation"
						/>
						{/* step=900 didn't work as expected, all minutes where selectable */}
						{/* // TODO check is still needed once https://github.com/db-ux-design-system/core-web/issues/5817 is fixed */}
						<datalist id={idRef.current}>
							{offsetOptionsToRender.map((value) => {
								return <option key={value} value={value} />;
							})}
						</datalist>
					</div>
				</>
			)}
		</div>
	);
};

const timezoneSignOptions = [
	{ value: '', label: '' },
	{ value: '+', label: '\u002b' }, // plus sign, rendered bigger than normal +
	{ value: '-', label: '\u2212' } // minus sign, rendered bigger than normal -
];

const offsetOptions: Array<string> = [];

let hours = 0;
for (let i = 0, l = 56; i <= l; i++) {
	if (i % 4 === 0 && i !== 0) {
		hours++;
	}

	const newHours = hours.toString().padStart(2, '0');
	const minutes = (i % 4) * 15;
	const minutesString = minutes.toString().padStart(2, '0');

	offsetOptions.push(newHours + ':' + minutesString);
}
