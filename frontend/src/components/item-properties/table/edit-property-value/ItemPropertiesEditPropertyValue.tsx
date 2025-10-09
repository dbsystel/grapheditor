import './ItemPropertiesEditPropertyValue.scss';
import { DBTextarea } from '@db-ux/react-core-components';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { getPropertyValuePlaceholder } from 'src/components/item-properties/helpers';
import { adjustElementHeight } from 'src/utils/helpers/general';
import { ItemPropertiesEditPropertyValueProps } from './ItemPropertiesEditPropertyValue.interfaces';

export const ItemPropertiesEditPropertyValue = ({
	property,
	onChange,
	isEditMode
}: ItemPropertiesEditPropertyValueProps) => {
	const [value, setValue] = useState(property.value);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		setValue(property.value);
		adjustTextareaHeight();
	}, [property]);

	const adjustTextareaHeight = () => {
		const textarea = textareaRef.current;
		if (textarea) {
			adjustElementHeight(textarea);
		}
	};

	const onInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		setValue(event.target.value);
		adjustTextareaHeight();

		if (onChange) {
			onChange(event);
		}
	};

	const propertyValuePlaceholder = getPropertyValuePlaceholder(property.type);

	return (
		<div className="item-properties-table__edit-property-value">
			<DBTextarea
				ref={textareaRef}
				label=""
				value={value}
				onChange={onInputChange}
				validMessage=""
				invalidMessage=""
				rows={1}
				placeholder={propertyValuePlaceholder}
				readOnly={!isEditMode}
			/>
		</div>
	);
};
