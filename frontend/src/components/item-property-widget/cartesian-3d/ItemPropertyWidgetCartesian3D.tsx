import clsx from 'clsx';
import { useState } from 'react';
import { ItemPropertyWidgetFloat } from 'src/components/item-property-widget/float/ItemPropertyWidgetFloat';
import { PrintObject } from 'src/components/print-object/PrintObject';
import { Cartesian3D } from 'src/models/graph';
import { clone } from 'src/utils/helpers/general';
import { itemPropertyDefaults } from 'src/utils/helpers/items';
import { ItemPropertyWidgetCartesian3DProps } from './ItemPropertyWidgetCartesian3D.interfaces';

export const ItemPropertyWidgetCartesian3D = ({
	isEditMode,
	onChange,
	defaultValue,
	value,
	id,
	className,
	testId
}: ItemPropertyWidgetCartesian3DProps) => {
	const [localValue, setLocalValue] = useState(
		defaultValue || value || itemPropertyDefaults['cartesian_3d']().value
	);
	const rootElementClassName = clsx('item-property-widget-cartesian-3d', className);
	const isControlled = value !== undefined;
	const displayValue = isControlled ? value : localValue;

	const localOnChange = (newValue: number, key: keyof Cartesian3D) => {
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
					<ItemPropertyWidgetFloat
						defaultValue={displayValue.z}
						onChange={(newValue) => localOnChange(newValue, 'z')}
						isEditMode={isEditMode}
						label="Z"
					/>
				</>
			)}
		</div>
	);
};
