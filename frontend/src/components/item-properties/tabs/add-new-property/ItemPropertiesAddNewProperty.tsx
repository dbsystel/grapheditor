import './ItemPropertiesAddNewProperty.scss';
import { DBButton, DBInput, DBSelect } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ItemFinder } from 'src/components/item-finder/ItemFinder';
import {
	getPropertyValuePlaceholder,
	parsePropertyValue,
	showNotificationForPropertyTypeAndValueMismatch
} from 'src/components/item-properties/helpers';
import { FormItemProperty } from 'src/models/general';
import { Item } from 'src/models/item';
import { Node } from 'src/models/node';
import { useItemsStore } from 'src/stores/items';
import { useNotificationsStore } from 'src/stores/notifications';
import { ALLOWED_ITEM_PROPERTY_TYPE_OPTIONS, GraphEditorTypeSimplified } from 'src/utils/constants';
import { patch } from 'src/utils/fetch/patch';
import { getItemEndpoint } from 'src/utils/helpers/items';
import { nodeContainsSearchTerm } from 'src/utils/helpers/nodes';
import { useGetNodesPropertiesNodes } from 'src/utils/hooks/useGetNodesPropertiesNodes';
import { idFormatter } from 'src/utils/idFormatter';
import { ItemPropertiesAddNewPropertyProps } from './ItemPropertiesAddNewProperty.interfaces';

export const ItemPropertiesAddNewProperty = ({
	item,
	onPropertyCreate,
	id,
	className,
	testId
}: ItemPropertiesAddNewPropertyProps) => {
	// react-hook-form data
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
	const [isLoading, setIsLoading] = useState(false);
	const [allProperties, setAllProperties] = useState<Array<Node>>([]);
	const [propertyOptions, setPropertyOptions] = useState<Array<Node>>([]);
	const [selectedProperty, setSelectedProperty] = useState<Node | null>(null);
	const searchTermRef = useRef('');
	const addNotification = useNotificationsStore((store) => store.addNotification);
	const getNodeAsync = useItemsStore((store) => store.getNodeAsync);
	const userSelectedExistingOption = useRef(false);
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

		if (propertyValidationOk && !isLoading) {
			const { key, value, type } = getValues();
			const itemProperties = item.properties;
			const parsedValue = parsePropertyValue(type, value);

			if (parsedValue === null) {
				showNotificationForPropertyTypeAndValueMismatch();
				return;
			}

			setIsLoading(true);

			itemProperties[key] = {
				value: parsedValue,
				type: type,
				edit: true
			};

			const updatedItemResponse = await patch<Item>(getItemEndpoint(item), {
				properties: itemProperties
			});

			// TODO improve TS to support Node and PseudoNode types
			const newPropertyPseudoNode = await getNodeAsync(
				idFormatter.formatObjectId(GraphEditorTypeSimplified.META_PROPERTY, key),
				true
			);

			if (!userSelectedExistingOption.current) {
				setAllProperties([...allProperties, newPropertyPseudoNode]);
				setPropertyOptions([...propertyOptions, newPropertyPseudoNode]);
				setSelectedProperty(newPropertyPseudoNode);
			}

			if (onPropertyCreate) {
				onPropertyCreate(
					updatedItemResponse.data,
					{
						key: key,
						value: value,
						type: type,
						edit: true
					},
					newPropertyPseudoNode
				);
			}

			setSelectedProperty(null);
			resetField('value');

			addNotification({
				title: t('notifications_success_property_mode', {
					mode: t('notifications_prefix_create')
				}),
				type: 'successful'
			});

			setIsLoading(false);
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
		userSelectedExistingOption.current = false;

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
		userSelectedExistingOption.current = true;

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
							label={t('form_property_key')}
							options={propertyOptions}
							defaultInputValue={searchTermRef.current}
							onInput={onKeySearch}
							searchTimeoutMilliseconds={0}
							onChange={onKeyChange}
							semantic={errors?.key ? 'critical' : 'adaptive'}
							invalidMessage={errors?.key?.message}
							validMessage=""
							isDisabled={isLoading || isNodesPropertiesLoading}
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
							disabled={isLoading}
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
						disabled={isLoading}
						validMessage=""
						invalidMessage=""
					/>
				)}
			/>
			<DBButton
				className="item-properties-tabs__add-new-property-save-button"
				type="submit"
				variant="filled"
				disabled={isLoading}
				size="small"
				onClick={onPropertyCreateLocal}
			>
				{t('form_add_button')}
			</DBButton>
		</div>
	);
};
