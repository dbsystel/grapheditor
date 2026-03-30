import { ItemPropertyShapeBoolean } from 'src/models/item';
import { GlobalComponentProps } from 'src/types/components';

export type ItemPropertyWidgetBooleanProps = GlobalComponentProps & {
	isEditMode?: boolean;
	defaultValue?: ItemPropertyShapeBoolean['value'];
	value?: ItemPropertyShapeBoolean['value'];
	onChange?: (newValue: ItemPropertyShapeBoolean['value']) => void;
};
