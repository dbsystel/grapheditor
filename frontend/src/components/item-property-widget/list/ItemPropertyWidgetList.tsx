import './ItemPropertyWidgetList.scss';
import { DBButton } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { DragEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ItemPropertyTypeDropdown } from 'src/components/item-property-type-dropdown/ItemPropertyTypeDropdown';
import { ItemPropertyValue } from 'src/components/item-property-value/ItemPropertyValue';
import { ItemProperty, ItemPropertyShapeNonList, ItemPropertyTypeNonList } from 'src/models/item';
import { clone, getAt, getElementIndex, isElementBeforeElement } from 'src/utils/helpers/general';
import {
	getDefaultItemPropertyForItemPropertyType,
	isItemPropertyOfTypeList,
	itemPropertyDefaults
} from 'src/utils/helpers/items';
import { ItemPropertyWidgetListProps } from './ItemPropertyWidgetList.interfaces';

// TODO create a separate drag and drop component
export const ItemPropertyWidgetList = ({
	isEditMode,
	onChange,
	defaultValue,
	value,
	leadingElement,
	trailingElement,
	id,
	className,
	testId
}: ItemPropertyWidgetListProps) => {
	const { t } = useTranslation();
	const [localValue, setLocalValue] = useState(
		clone(defaultValue || value || itemPropertyDefaults['list']().value)
	);
	const draggedElementRef = useRef<HTMLLIElement | null>(null);
	const listKeyRef = useRef(window.crypto.randomUUID());
	const subPropertyTypeRef = useRef<ItemPropertyTypeNonList>('string');
	const rootElementClassName = clsx('item-property-widget-list', className);
	const isControlled = value !== undefined;
	const displayValue = isControlled ? value : localValue;

	const localOnChange = (updatedProperty: ItemProperty, index?: number) => {
		const valueClone = clone(displayValue);

		if (index !== undefined && !isItemPropertyOfTypeList(updatedProperty)) {
			valueClone[index].value = updatedProperty.value;

			updateLocalValue(valueClone);

			if (onChange) {
				onChange(valueClone);
			}
		}
	};

	const updateLocalValue = (newValue: Array<ItemPropertyShapeNonList>) => {
		if (!isControlled) {
			setLocalValue(newValue);
		}
	};

	const addPropertyToList = () => {
		const valueClone = clone(displayValue);
		const newPropertyType: ItemPropertyTypeNonList =
			valueClone.length === 0 ? subPropertyTypeRef.current : getAt(valueClone, 0).type;

		const newItemProperty = getDefaultItemPropertyForItemPropertyType(newPropertyType);
		valueClone.push(newItemProperty);

		updateLocalValue(valueClone);

		if (onChange) {
			onChange(valueClone);
		}
	};

	const onListItemDelete = (index: number) => {
		const valueClone = clone(displayValue);

		valueClone.splice(index, 1);

		updateLocalValue(valueClone);

		if (onChange) {
			onChange(valueClone);
		}
	};

	const onTypeChange = (newType: ItemPropertyTypeNonList) => {
		subPropertyTypeRef.current = newType;
	};

	function handleDragstart(event: DragEvent<HTMLLIElement>) {
		// firefox requirement
		event.dataTransfer.effectAllowed = 'move';
		event.dataTransfer.setData('text/plain', getElementIndex(event.currentTarget).toString());
		draggedElementRef.current = event.currentTarget;
	}

	function handleDragenter(event: DragEvent<HTMLLIElement>) {
		const draggedElement = draggedElementRef.current;

		if (!draggedElement) {
			return;
		}

		const selectedIndex = getElementIndex(draggedElement);
		const targetIndex = getElementIndex(event.currentTarget);

		if (isElementBeforeElement(draggedElement, event.currentTarget)) {
			event.currentTarget.parentNode?.insertBefore(draggedElement, event.currentTarget);
		} else {
			// make sure to insert only once on drag enter (the event is triggered multiple times)
			if (selectedIndex !== targetIndex) {
				event.currentTarget.parentNode?.insertBefore(
					draggedElement,
					event.currentTarget.nextSibling
				);
			}
		}
	}

	function handleDragover(event: DragEvent<HTMLLIElement>) {
		event.preventDefault(); // this is needed for drop to fire
		event.dataTransfer.dropEffect = 'move';
	}

	function handleDrop(event: DragEvent<HTMLLIElement>) {
		event.preventDefault();

		listKeyRef.current = window.crypto.randomUUID();

		const draggedElement = draggedElementRef.current;

		if (!draggedElement) {
			return;
		}

		const finalOrderOfElements = Array.from(
			draggedElement.parentNode?.querySelectorAll('[data-index]') || []
		)
			.filter((sibling) => {
				return sibling instanceof HTMLElement;
			})
			.map((sibling) => {
				return parseInt(sibling.dataset.index || '0', 10);
			});

		const valueClone = clone(displayValue);
		const newValue: ItemPropertyShapeNonList[] = [];

		// rearrange the value based on the final order of elements
		finalOrderOfElements.forEach((newIndex, index) => {
			newValue[index] = valueClone[newIndex];
		});

		updateLocalValue(newValue);

		if (onChange) {
			onChange(newValue);
		}
	}

	function handleDragend() {
		draggedElementRef.current = null;
	}

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{displayValue.length === 0 && isEditMode && (
				<div className="item-property-widget-list__new-property">
					<ItemPropertyTypeDropdown
						onChange={onTypeChange}
						shouldExcludeListTypes={true}
					/>
					<DBButton
						type="button"
						variant="outlined"
						size="small"
						onClick={addPropertyToList}
						className="item-property-widget-list__new-property-add-button"
					>
						{t('item_property_widget_list_apply')}
					</DBButton>
				</div>
			)}

			{displayValue.length > 0 && (
				<>
					<ul className="item-property-widget-list__list">
						{displayValue.map((propertyValue, index) => {
							return (
								<li
									className="item-property-widget-list__list-item"
									key={index + listKeyRef.current}
									draggable={isEditMode === true}
									onDragStart={handleDragstart}
									onDragEnter={handleDragenter}
									onDragOver={handleDragover}
									onDragEnd={handleDragend}
									onDrop={handleDrop}
									data-index={index}
								>
									<ItemPropertyValue
										property={propertyValue}
										onChange={localOnChange}
										listIndex={index}
										leadingElement={leadingElement}
										trailingElement={trailingElement}
										isEditMode={isEditMode}
									/>
									{isEditMode === true && (
										<div className="item-property-widget-list__list-item-actions">
											<DBButton
												className="item-property-widget-list__list-item-drag-handle"
												icon="arrows_vertical"
												size="small"
												noText={true}
											/>
											<DBButton
												type="button"
												icon="bin"
												size="small"
												noText={true}
												onClick={() => onListItemDelete(index)}
											/>
										</div>
									)}
								</li>
							);
						})}
					</ul>
					{isEditMode && (
						<DBButton
							className="item-property-widget-list__add-property-button"
							type="button"
							icon="plus"
							size="small"
							noText={true}
							onClick={addPropertyToList}
						/>
					)}
				</>
			)}
		</div>
	);
};
