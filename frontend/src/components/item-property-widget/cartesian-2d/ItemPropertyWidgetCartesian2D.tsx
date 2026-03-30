import clsx from 'clsx';
import { useState } from 'react';
import { ItemPropertyWidgetFloat } from 'src/components/item-property-widget/float/ItemPropertyWidgetFloat';
import { PrintObject } from 'src/components/print-object/PrintObject';
import { Cartesian2D } from 'src/models/graph';
import { clone } from 'src/utils/helpers/general';
import { itemPropertyDefaults } from 'src/utils/helpers/items';
import { ItemPropertyWidgetCartesian2DProps } from './ItemPropertyWidgetCartesian2D.interfaces';

export const ItemPropertyWidgetCartesian2D = ({
	isEditMode,
	onChange,
	defaultValue,
	value,
	id,
	className,
	testId
}: ItemPropertyWidgetCartesian2DProps) => {
	const [localValue, setLocalValue] = useState(
		defaultValue || value || itemPropertyDefaults['cartesian_2d']().value
	);
	const rootElementClassName = clsx('item-property-widget-cartesian-2d', className);
	const isControlled = value !== undefined;
	const displayValue = isControlled ? value : localValue;

	const localOnChange = (newValue: number, key: keyof Cartesian2D) => {
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
						defaultValue={displayValue.x}
						onChange={(newValue) => localOnChange(newValue, 'x')}
						isEditMode={isEditMode}
						label="X"
					/>
					<ItemPropertyWidgetFloat
						defaultValue={displayValue.y}
						onChange={(newValue) => localOnChange(newValue, 'y')}
						isEditMode={isEditMode}
						label="Y"
					/>
				</>
			)}
		</div>
	);
};
