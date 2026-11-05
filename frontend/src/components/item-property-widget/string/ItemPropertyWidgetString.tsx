import { DBInfotext } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextareaAutosize } from 'src/components/textarea-autosize/TextareaAutosize';
import { isString, safeStringify } from 'src/utils/helpers/general';
import { itemPropertyDefaults } from 'src/utils/helpers/items';
import { ItemPropertyWidgetStringProps } from './ItemPropertyWidgetString.interfaces';

export const ItemPropertyWidgetString = ({
	isEditMode,
	onChange,
	defaultValue,
	value,
	id,
	className,
	testId
}: ItemPropertyWidgetStringProps) => {
	const { t } = useTranslation();
	const [localValue, setLocalValue] = useState(
		defaultValue || value || itemPropertyDefaults['string']().value
	);
	const textareaId = useRef(window.crypto.randomUUID());
	const rootElementClassName = clsx('item-property-widget-string', className);
	const isControlled = value !== undefined;
	const displayValue = isControlled ? value : localValue;

	const localOnChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		const newValue = event.target.value;

		setLocalValue(newValue);

		if (onChange) {
			onChange(newValue);
		}
	};

	// string properties accept any string, so this is mostly a defensive check against a
	// corrupted controlled "value" prop coming from outside this component
	const isValid = isString(displayValue);

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{/* JSON.stringify will add double quotes automatically */}
			{!isEditMode && JSON.stringify(displayValue)}
			{isEditMode && (
				<div>
					<label htmlFor={textareaId.current}>
						{t('item_property_widget_string_label')}
					</label>
					<TextareaAutosize
						textareaId={textareaId.current}
						value={displayValue}
						onChange={localOnChange}
						autoComplete="off"
						autoCorrect="off"
						autoCapitalize="off"
						spellCheck={false}
						data-density="functional"
						label=""
						showLabel={false}
						resize="none"
						validation="no-validation"
					/>
				</div>
			)}
			{!isValid && (
				<DBInfotext
					semantic="warning"
					text={t('item_property_widget_string_invalid_message', {
						context: displayValue ? 'with_value' : undefined,
						value: safeStringify(displayValue)
					})}
				/>
			)}
		</div>
	);
};
