import { ItemProperty, ItemPropertyKey, ItemPropertyTypeWithListSubtypes } from 'src/models/item';
import { Node } from 'src/models/node';
import { GlobalComponentProps } from 'src/types/components';

export type AddNewPropertyProps = GlobalComponentProps & {
	onPropertyCreate: (key: ItemPropertyKey, property: ItemProperty, propertyNode?: Node) => void;
	shouldHideKeyField?: boolean;
	submitButtonText?: string;
	isEditMode?: boolean;
};

export type AddNewPropertyFormState = {
	key: ItemPropertyKey;
	type: ItemPropertyTypeWithListSubtypes;
} & Omit<ItemProperty, 'edit' | 'type'>;
