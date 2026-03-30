import { ItemPropertyShapeDate } from 'src/models/item';
import { GlobalComponentProps } from 'src/types/components';

export type ItemPropertyWidgetDateProps = GlobalComponentProps & {
	isEditMode?: boolean;
	defaultValue?: ItemPropertyShapeDate['value'];
	value?: ItemPropertyShapeDate['value'];
	onChange?: (newValue: ItemPropertyShapeDate['value']) => void;
};
