import clsx from 'clsx';
import { useState } from 'react';
import { ItemPropertyWidgetFloat } from 'src/components/item-property-widget/float/ItemPropertyWidgetFloat';
import { PrintObject } from 'src/components/print-object/PrintObject';
import { Wgs8423D } from 'src/models/graph';
import { clone } from 'src/utils/helpers/general';
import { itemPropertyDefaults } from 'src/utils/helpers/items';
import { ItemPropertyWidgetWgs843DProps } from './ItemPropertyWidgetWgs843D.interfaces';

export const ItemPropertyWidgetWgs843D = ({
	isEditMode,
	onChange,
	defaultValue,
	value,
	id,
	className,
	testId
}: ItemPropertyWidgetWgs843DProps) => {
	const [localValue, setLocalValue] = useState(
		defaultValue || value || itemPropertyDefaults['wgs84_3d']().value
	);
	const rootElementClassName = clsx('item-property-widget-wgs84-3d', className);
	const isControlled = value !== undefined;
	const displayValue = isControlled ? value : localValue;

	const localOnChange = (newValue: number, key: keyof Wgs8423D) => {
		const valueStateClone = clone(displayValue);
		valueStateClone[key] = newValue;

		if (!isControlled) {
			setLocalValue(valueStateClone);
		}

		if (onChange) {
			onChange(valueStateClone);
		}
	};

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{!isEditMode && <PrintObject object={displayValue} />}
			{isEditMode && (
				<>
					<ItemPropertyWidgetFloat
						defaultValue={displayValue.latitude}
						onChange={(newValue) => localOnChange(newValue, 'latitude')}
						isEditMode={isEditMode}
						label="Latitude"
					/>
					<ItemPropertyWidgetFloat
						defaultValue={displayValue.longitude}
						onChange={(newValue) => localOnChange(newValue, 'longitude')}
						isEditMode={isEditMode}
						label="Longitude"
					/>
					<ItemPropertyWidgetFloat
						defaultValue={displayValue.height}
						onChange={(newValue) => localOnChange(newValue, 'height')}
						isEditMode={isEditMode}
						label="Height"
					/>
				</>
			)}
		</div>
	);
};
