import { ItemPropertyShapeFloat } from 'src/models/item';
import { GlobalComponentProps } from 'src/types/components';

export type ItemPropertyWidgetFloatProps = GlobalComponentProps & {
	isEditMode?: boolean;
	label?: string;
	defaultValue?: ItemPropertyShapeFloat['value'];
	value?: ItemPropertyShapeFloat['value'];
	onChange?: (newValue: ItemPropertyShapeFloat['value']) => void;
};
