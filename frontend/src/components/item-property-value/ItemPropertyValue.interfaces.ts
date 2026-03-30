import { ReactNode } from 'react';
import { ItemProperty } from 'src/models/item';
import { GlobalComponentProps } from 'src/types/components';

export type ItemPropertyValueProps = GlobalComponentProps & {
	property: ItemProperty;
	// - updatedProperty: object - the updated property object
	// - index?: number - the index of the property in a list (optional)
	onChange?: (updatedProperty: ItemProperty, index?: number) => void;
	listIndex?: number;
	leadingElement?: (listIndex?: number) => ReactNode;
	trailingElement?: (listIndex?: number) => ReactNode;
	isEditMode?: boolean;
	isWidgetControlled?: boolean;
};
