import './AddNewProperty.scss';
import { DBButton } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ItemFinder } from 'src/components/item-finder/ItemFinder';
import { ItemPropertyTypeDropdown } from 'src/components/item-property-type-dropdown/ItemPropertyTypeDropdown';
import { ItemPropertyValue } from 'src/components/item-property-value/ItemPropertyValue';
import {
	ItemProperty,
	ItemPropertyType,
	ItemPropertyTypeNonList,
	ItemPropertyTypeWithListSubtypes
} from 'src/models/item';
import { Node } from 'src/models/node';
import { GraphEditorTypeSimplified } from 'src/utils/constants';
import {
	getDefaultItemPropertyForItemPropertyType,
	isItemPropertyOfTypeList,
	isItemPropertyTypeNonList
} from 'src/utils/helpers/items';
import { nodeContainsSearchTerm } from 'src/utils/helpers/nodes';
import { useGetNodesPropertiesNodes } from 'src/utils/hooks/useGetNodesPropertiesNodes';
import { idFormatter } from 'src/utils/id-formatter';
import { AddNewPropertyFormState, AddNewPropertyProps } from './AddNewProperty.interfaces';

const componentDefaultPropertyType: ItemPropertyType = 'string';

export const AddNewProperty = ({
	onPropertyCreate,
	shouldHideKeyField,
	submitButtonText,
	isEditMode = true,
	id,
	className,
	testId
}: AddNewPropertyProps) => {
	const localDefaultPropertyRef = useRef(
		getDefaultItemPropertyForItemPropertyType(componentDefaultPropertyType)
	);
	const { control, trigger, setValue, getValues, formState, resetField, watch } =
		useForm<AddNewPropertyFormState>({
			mode: 'onSubmit',
			reValidateMode: 'onChange',
			defaultValues: {
				key: '',
				value: localDefaultPropertyRef.current.value || '',
				type: localDefaultPropertyRef.current.type
			}
		});
	const { errors } = formState;
	const { t } = useTranslation();
	const [allProperties, setAllProperties] = useState<Array<Node>>([]);
	const [propertyOptions, setPropertyOptions] = useState<Array<Node>>([]);
	const [selectedProperty, setSelectedProperty] = useState<Node | null>(null);
	const [newProperty, setNewProperty] = useState<ItemProperty>(localDefaultPropertyRef.current);
	const rootElementClassName = clsx('add-new-property', className);

	const { isLoading: isNodesPropertiesLoading } = useGetNodesPropertiesNodes({
		executeImmediately: !shouldHideKeyField,
		onSuccess: (response) => {
			const properties = Object.values(response.data.nodes);

			setAllProperties(properties);
			setPropertyOptions(properties);
		}
	});

	/**
	 * Function executed on the ItemFinder's "onChange" callback.
	 * It will update the form's "key" field, since that field is not connected
	 * to the form directly.
	 * TODO check if we need to inherit property type from selected property
	 */
	const onKeyChange = (property: Node) => {
		setValue('key', property.id);

		setSelectedProperty(property);
		triggerKeyFieldValidation();
	};

	const onTypeChange = (
		value: ItemPropertyTypeWithListSubtypes,
		newType: ItemPropertyType,
		subType?: ItemPropertyTypeNonList
	) => {
		setValue('type', value);

		const newTypeProperty = getDefaultItemPropertyForItemPropertyType(newType);

		if (isItemPropertyOfTypeList(newTypeProperty) && isItemPropertyTypeNonList(subType)) {
			const subTypeProperty = getDefaultItemPropertyForItemPropertyType(subType);

			newTypeProperty.value.push(subTypeProperty);
		}

		setNewProperty(newTypeProperty);

		// reset form field error on change (the default way is not working :/)
		if (errors['type']) {
			trigger('type');
		}
	};

	const onValueChange = (value: ItemProperty) => {
		setValue('value', value.value);
		setNewProperty(value);
	};

	/**
	 * Function responsible for creating new properties in the backend.
	 */
	const onPropertyCreateLocal = async () => {
		// note: it looks like form validation is not considering the non-rendered controls
		const propertyValidationOk = await trigger();

		if (propertyValidationOk) {
			const { key } = getValues();
			const semanticId = idFormatter.isValidSemanticId(key)
				? key
				: idFormatter.formatSemanticId(GraphEditorTypeSimplified.META_PROPERTY, key);
			const propertyNode = propertyOptions.find(
				(propertyOption) => propertyOption.id === key
			);

			onPropertyCreate(semanticId, newProperty, propertyNode);

			resetField('key');
			resetField('value');

			setNewProperty(getDefaultItemPropertyForItemPropertyType(newProperty.type));
			setSelectedProperty(null);
		}
	};

	/**
	 * Function responsible for filtering loaded properties by the search term.
	 * It will also update the form's "key" field, since that field is not connected
	 * to the form directly.
	 */
	const onKeySearch = (searchTerm: string) => {
		const matchingProperties = allProperties.filter((property) => {
			return nodeContainsSearchTerm(property, searchTerm);
		});

		setValue('key', searchTerm);

		setPropertyOptions(matchingProperties);
		triggerKeyFieldValidation();
	};

	/**
	 * Function to trigger form's "key" field validation.
	 */
	const triggerKeyFieldValidation = () => {
		if (errors['key']) {
			trigger('key');
		}
	};

	const validationFunction = (value: string) => {
		if (value.trim().length === 0) {
			return t('validation_required');
		}
		return true;
	};

	const validationRules = {
		validate: validationFunction
	};

	/**
	 * Toggle between controlled and un-controlled input.
	 * This is needed in order to reset the input if the user never selected an option from dropdown
	 * ("selectedProperty" stays null), but instead just wrote something in the input field).
	 * As soon as the user starts typing something in or selects an option, the value of this variable
	 * will be "undefined" leaving the control of the input field value to the ItemFinder component.
	 * */
	const inputValue = !watch('key') && !selectedProperty ? '' : undefined;

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{!shouldHideKeyField && (
				<Controller
					control={control}
					name="key"
					rules={validationRules}
					render={() => {
						return (
							<ItemFinder
								value={selectedProperty}
								inputValue={inputValue}
								label={t('form_property_key')}
								options={propertyOptions}
								onInput={onKeySearch}
								searchTimeoutMilliseconds={0}
								onChange={onKeyChange}
								semantic={errors?.key ? 'critical' : 'adaptive'}
								invalidMessage={errors?.key?.message}
								validMessage=""
								isDisabled={isNodesPropertiesLoading || !isEditMode}
							/>
						);
					}}
				/>
			)}
			<Controller
				control={control}
				name="type"
				render={({ field: { onBlur } }) => {
					return (
						<ItemPropertyTypeDropdown
							isDisabled={!isEditMode}
							onChange={onTypeChange}
							onBlur={onBlur}
						/>
					);
				}}
			/>
			<Controller
				control={control}
				name="value"
				render={() => {
					return (
						<ItemPropertyValue
							property={newProperty}
							onChange={onValueChange}
							isEditMode={isEditMode}
							isWidgetControlled={true}
						/>
					);
				}}
			/>
			<DBButton
				className="add-new-property__save-button"
				type="submit"
				variant="filled"
				size="small"
				onClick={onPropertyCreateLocal}
				disabled={!isEditMode}
			>
				{submitButtonText || t('add_new_property_add')}
			</DBButton>
		</div>
	);
};
