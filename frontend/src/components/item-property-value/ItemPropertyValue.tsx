import './ItemPropertyValue.scss';
import clsx from 'clsx';
import { ItemPropertyWidgetBoolean } from 'src/components/item-property-widget/boolean/ItemPropertyWidgetBoolean';
import { ItemPropertyWidgetCartesian2D } from 'src/components/item-property-widget/cartesian-2d/ItemPropertyWidgetCartesian2D';
import { ItemPropertyWidgetCartesian3D } from 'src/components/item-property-widget/cartesian-3d/ItemPropertyWidgetCartesian3D';
import { ItemPropertyWidgetDate } from 'src/components/item-property-widget/date/ItemPropertyWidgetDate';
import { ItemPropertyWidgetDatetime } from 'src/components/item-property-widget/datetime/ItemPropertyWidgetDatetime';
import { ItemPropertyWidgetDuration } from 'src/components/item-property-widget/duration/ItemPropertyWidgetDuration';
import { ItemPropertyWidgetFloat } from 'src/components/item-property-widget/float/ItemPropertyWidgetFloat';
import { ItemPropertyWidgetInteger } from 'src/components/item-property-widget/integer/ItemPropertyWidgetInteger';
import { ItemPropertyWidgetList } from 'src/components/item-property-widget/list/ItemPropertyWidgetList';
import { ItemPropertyWidgetNotSupported } from 'src/components/item-property-widget/not-supported/ItemPropertyWidgetNotSupported';
import { ItemPropertyWidgetString } from 'src/components/item-property-widget/string/ItemPropertyWidgetString';
import { ItemPropertyWidgetTime } from 'src/components/item-property-widget/time/ItemPropertyWidgetTime';
import { ItemPropertyWidgetWgs842D } from 'src/components/item-property-widget/wgs84-2d/ItemPropertyWidgetWgs842D';
import { ItemPropertyWidgetWgs843D } from 'src/components/item-property-widget/wgs84-3d/ItemPropertyWidgetWgs843D';
import {
	isItemPropertyOfTypeList,
	isItemPropertyOfValidShapeBoolean,
	isItemPropertyOfValidShapeCartesian2D,
	isItemPropertyOfValidShapeCartesian3D,
	isItemPropertyOfValidShapeDate,
	isItemPropertyOfValidShapeDatetime,
	isItemPropertyOfValidShapeDuration,
	isItemPropertyOfValidShapeFloat,
	isItemPropertyOfValidShapeInteger,
	isItemPropertyOfValidShapeList,
	isItemPropertyOfValidShapeString,
	isItemPropertyOfValidShapeTime,
	isItemPropertyOfValidShapeWgs842D,
	isItemPropertyOfValidShapeWgs843D,
	isItemPropertyTypeValid
} from 'src/utils/helpers/items';
import { ItemPropertyValueProps } from './ItemPropertyValue.interfaces';

/**
 * This component renders the value editor for an item property based on its type. Since we have properties
 * where user can enter (but not save) invalid values, the component doesn't validate given property,
 * it only checks its type and renders the appropriate widget. Full validation should be done before using
 * this component.
 *
 * Since the component can be used for both single properties and list of properties, it is not relying
 * on the "property" prop for the latest value, but instead it uses a local state that is updated.
 * Nevertheless, when the "property" prop changes, the local state is updated accordingly.
 * This is a performance optimization to avoid rerendering the whole list when only one property changes.
 */
export const ItemPropertyValue = ({
	property,
	onChange,
	listIndex,
	leadingElement,
	trailingElement,
	isEditMode,
	isWidgetControlled,
	id,
	className,
	testId
}: ItemPropertyValueProps) => {
	const rootElementClassName = clsx('item-property-value', className);
	const isListType = isItemPropertyOfTypeList(property);
	const localLeadingElement = !isListType && leadingElement && leadingElement(listIndex);
	const localTrailingElement = !isListType && trailingElement && trailingElement(listIndex);

	// handle unsupported property types during runtime
	if (!isItemPropertyTypeValid(property.type)) {
		return <ItemPropertyWidgetNotSupported defaultValue={property.value} />;
	}

	// since we want to support both controlled and uncontrolled widgets, we need to determine the
	// prop name for the value
	const widgetValuePropName = isWidgetControlled ? 'value' : 'defaultValue';

	return (
		<div
			id={id}
			className={rootElementClassName}
			data-type={property.type}
			data-testid={testId}
		>
			{localLeadingElement}
			<div className="item-property-value__property-editor">
				{isItemPropertyOfValidShapeDuration(property) && (
					<ItemPropertyWidgetDuration
						isEditMode={isEditMode}
						onChange={(newValue) => {
							if (onChange) {
								onChange({ ...property, value: newValue }, listIndex);
							}
						}}
						{...{ [widgetValuePropName]: property.value }}
					/>
				)}
				{isItemPropertyOfValidShapeString(property) && (
					<ItemPropertyWidgetString
						isEditMode={isEditMode}
						onChange={(newValue) => {
							if (onChange) {
								onChange({ ...property, value: newValue }, listIndex);
							}
						}}
						{...{ [widgetValuePropName]: property.value }}
					/>
				)}
				{isItemPropertyOfValidShapeFloat(property) && (
					<ItemPropertyWidgetFloat
						isEditMode={isEditMode}
						onChange={(newValue) => {
							if (onChange) {
								onChange({ ...property, value: newValue }, listIndex);
							}
						}}
						{...{ [widgetValuePropName]: property.value }}
					/>
				)}
				{isItemPropertyOfValidShapeInteger(property) && (
					<ItemPropertyWidgetInteger
						isEditMode={isEditMode}
						onChange={(newValue) => {
							if (onChange) {
								onChange({ ...property, value: newValue }, listIndex);
							}
						}}
						{...{ [widgetValuePropName]: property.value }}
					/>
				)}
				{isItemPropertyOfValidShapeDate(property) && (
					<ItemPropertyWidgetDate
						isEditMode={isEditMode}
						onChange={(newValue) => {
							if (onChange) {
								onChange({ ...property, value: newValue }, listIndex);
							}
						}}
						{...{ [widgetValuePropName]: property.value }}
					/>
				)}
				{isItemPropertyOfValidShapeTime(property) && (
					<ItemPropertyWidgetTime
						isEditMode={isEditMode}
						onChange={(newValue) => {
							if (onChange) {
								onChange({ ...property, value: newValue }, listIndex);
							}
						}}
						{...{ [widgetValuePropName]: property.value }}
					/>
				)}
				{isItemPropertyOfValidShapeDatetime(property) && (
					<ItemPropertyWidgetDatetime
						isEditMode={isEditMode}
						onChange={(newValue) => {
							if (onChange) {
								onChange({ ...property, value: newValue }, listIndex);
							}
						}}
						{...{ [widgetValuePropName]: property.value }}
					/>
				)}
				{isItemPropertyOfValidShapeBoolean(property) && (
					<ItemPropertyWidgetBoolean
						isEditMode={isEditMode}
						onChange={(newValue) => {
							if (onChange) {
								onChange({ ...property, value: newValue }, listIndex);
							}
						}}
						{...{ [widgetValuePropName]: property.value }}
					/>
				)}
				{isItemPropertyOfValidShapeCartesian2D(property) && (
					<ItemPropertyWidgetCartesian2D
						isEditMode={isEditMode}
						onChange={(newValue) => {
							if (onChange) {
								onChange({ ...property, value: newValue }, listIndex);
							}
						}}
						{...{ [widgetValuePropName]: property.value }}
					/>
				)}
				{isItemPropertyOfValidShapeCartesian3D(property) && (
					<ItemPropertyWidgetCartesian3D
						isEditMode={isEditMode}
						onChange={(newValue) => {
							if (onChange) {
								onChange({ ...property, value: newValue }, listIndex);
							}
						}}
						{...{ [widgetValuePropName]: property.value }}
					/>
				)}
				{isItemPropertyOfValidShapeWgs842D(property) && (
					<ItemPropertyWidgetWgs842D
						isEditMode={isEditMode}
						onChange={(newValue) => {
							if (onChange) {
								onChange({ ...property, value: newValue }, listIndex);
							}
						}}
						{...{ [widgetValuePropName]: property.value }}
					/>
				)}
				{isItemPropertyOfValidShapeWgs843D(property) && (
					<ItemPropertyWidgetWgs843D
						isEditMode={isEditMode}
						onChange={(newValue) => {
							if (onChange) {
								onChange({ ...property, value: newValue }, listIndex);
							}
						}}
						{...{ [widgetValuePropName]: property.value }}
					/>
				)}
				{isItemPropertyOfValidShapeList(property) && (
					<ItemPropertyWidgetList
						isEditMode={isEditMode}
						onChange={(newValue) => {
							if (onChange) {
								onChange({ ...property, value: newValue }, listIndex);
							}
						}}
						leadingElement={leadingElement}
						trailingElement={trailingElement}
						{...{ [widgetValuePropName]: property.value }}
					/>
				)}
			</div>
			{localTrailingElement}
		</div>
	);
};
