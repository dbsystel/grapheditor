import './ItemPropertyWidgetBoolean.scss';
import { DBCheckbox, DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { itemPropertyDefaults } from 'src/utils/helpers/items';
import { ItemPropertyWidgetBooleanProps } from './ItemPropertyWidgetBoolean.interfaces';

export const ItemPropertyWidgetBoolean = ({
	isEditMode,
	onChange,
	defaultValue,
	value,
	id,
	className,
	testId
}: ItemPropertyWidgetBooleanProps) => {
	const { t } = useTranslation();
	const [localValue, setLocalValue] = useState(
		defaultValue || value || itemPropertyDefaults['boolean']().value
	);
	const rootElementClassName = clsx('item-property-widget-boolean', className);
	const isControlled = value !== undefined;
	const displayValue = isControlled ? value : localValue;

	const localOnChange = (event: ChangeEvent<HTMLInputElement>) => {
		const newValue = event.target.value === 'true';

		if (!isControlled) {
			setLocalValue(newValue);
		}

		if (onChange) {
			onChange(newValue);
		}
	};

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<div className="item-property-widget-boolean__content">
				<DBCheckbox
					label=""
					showLabel={false}
					checked={displayValue === true}
					value={displayValue === true ? 'false' : 'true'}
					size="small"
					onChange={localOnChange}
					disabled={!isEditMode}
				/>
				<DBTooltip
					className="item-properties-table__warning-tooltip db-tooltip-fix db-tooltip-fix--top-start"
					width="auto"
				>
					{t('item_property_widget_boolean_tooltip')}
				</DBTooltip>
			</div>
		</div>
	);
};
