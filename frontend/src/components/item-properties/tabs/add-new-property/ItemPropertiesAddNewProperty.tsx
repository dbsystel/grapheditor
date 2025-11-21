import './ItemPropertiesAddNewProperty.scss';
import { DBButton, DBInput, DBSelect } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ItemFinder } from 'src/components/item-finder/ItemFinder';
import {
	getPropertyValuePlaceholder,
	parsePropertyValue,
	showNotificationForPropertyTypeAndValueMismatch
} from 'src/components/item-properties/helpers';
import { FormItemProperty } from 'src/models/general';
import { Node } from 'src/models/node';
import { ALLOWED_ITEM_PROPERTY_TYPE_OPTIONS, GraphEditorTypeSimplified } from 'src/utils/constants';
import { nodeContainsSearchTerm } from 'src/utils/helpers/nodes';
import { useGetNodesPropertiesNodes } from 'src/utils/hooks/useGetNodesPropertiesNodes';
import { idFormatter } from 'src/utils/idFormatter';
import { ItemPropertiesAddNewPropertyProps } from './ItemPropertiesAddNewProperty.interfaces';

export const ItemPropertiesAddNewProperty = ({
	onPropertyCreate,
	id,
	className,
	testId
}: ItemPropertiesAddNewPropertyProps) => {
	const { control, trigger, setValue, getValues, formState, resetField, watch } =
		useForm<FormItemProperty>({
			mode: 'onSubmit',
			reValidateMode: 'onChange',
			defaultValues: {
				key: '',
				value: '',
				type: 'string'
			}
		});
	const { errors } = formState;
	const { t } = useTranslation();
	const [allProperties, setAllProperties] = useState<Array<Node>>([]);
	const [propertyOptions, setPropertyOptions] = useState<Array<Node>>([]);
	const [selectedProperty, setSelectedProperty] = useState<Node | null>(null);
	const rootElementClassName = clsx('item-properties-tabs__add-new-property', className);

	const { isLoading: isNodesPropertiesLoading } = useGetNodesPropertiesNodes({
		executeImmediately: true,
		onSuccess: (properties) => {
			setAllProperties(properties);
			setPropertyOptions(properties);
		}
	});

	const onPropertyChange = <E,>(
		event: ChangeEvent<E>,
		formInputOnChange: (event: ChangeEvent<E>) => void,
		key: keyof FormItemProperty
	) => {
		formInputOnChange(event);

		// reset form field error on change (the default way is not working :/)
		if (errors[key]) {
			trigger(key);
		}
	};

	/**
	 * Function responsible for creating new properties in the backend.
	 */
	const onPropertyCreateLocal = async () => {
		const propertyValidationOk = await trigger();

		if (propertyValidationOk) {
			const { key, value, type } = getValues();
			const parsedValue = parsePropertyValue(type, value);

			if (parsedValue === null) {
				showNotificationForPropertyTypeAndValueMismatch();
				return;
			}

			const semanticId = idFormatter.isValidSemanticId(key)
				? key
				: idFormatter.formatSemanticId(GraphEditorTypeSimplified.META_PROPERTY, key);
			const propertyNode = propertyOptions.find(
				(propertyOption) => propertyOption.id === key
			);

			onPropertyCreate(
				{
					key: semanticId,
					value: parsedValue,
					type: type,
					edit: true
				},
				propertyNode
			);

			resetField('key');
			resetField('value');

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

	/**
	 * Function executed on the ItemFinder's "onChange" callback.
	 * It will update the form's "key" field, since that field is not connected
	 * to the form directly.
	 */
	const onKeyChange = (property: Node) => {
		setValue('key', property.id);

		setSelectedProperty(property);
		triggerKeyFieldValidation();
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

	const propertyValuePlaceholder = getPropertyValuePlaceholder(watch('type') ?? 'string');
	const propertyValueLabel = `${t('form_property_value')} (${propertyValuePlaceholder})`;
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
							isDisabled={isNodesPropertiesLoading}
						/>
					);
				}}
			/>
			<Controller
				control={control}
				name="type"
				render={({ field: { value, onBlur, onChange } }) => {
					return (
						<DBSelect
							value={value}
							onChange={(event) => onPropertyChange(event, onChange, 'type')}
							onBlur={onBlur}
							options={ALLOWED_ITEM_PROPERTY_TYPE_OPTIONS}
							label={t('form_property_type')}
							variant="floating"
						/>
					);
				}}
			/>
			<Controller
				control={control}
				name="value"
				render={({ field: { value, onBlur, onChange } }) => (
					<DBInput
						label={propertyValueLabel}
						variant="floating"
						onChange={(event) => onPropertyChange(event, onChange, 'value')}
						onBlur={onBlur}
						value={value}
						validMessage=""
						invalidMessage=""
					/>
				)}
			/>
			<DBButton
				className="item-properties-tabs__add-new-property-save-button"
				type="submit"
				variant="filled"
				size="small"
				onClick={onPropertyCreateLocal}
			>
				{t('form_add_button')}
			</DBButton>
		</div>
	);
};
