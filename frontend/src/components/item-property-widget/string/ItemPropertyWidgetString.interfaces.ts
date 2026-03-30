import { ItemPropertyShapeString } from 'src/models/item';
import { GlobalComponentProps } from 'src/types/components';

export type ItemPropertyWidgetStringProps = GlobalComponentProps & {
	isEditMode?: boolean;
	defaultValue?: ItemPropertyShapeString['value'];
	value?: ItemPropertyShapeString['value'];
	onChange?: (newValue: ItemPropertyShapeString['value']) => void;
};
