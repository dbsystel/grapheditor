import { ItemPropertyShapeInteger } from 'src/models/item';
import { GlobalComponentProps } from 'src/types/components';

export type ItemPropertyWidgetIntegerProps = GlobalComponentProps & {
	isEditMode?: boolean;
	defaultValue?: ItemPropertyShapeInteger['value'];
	value?: ItemPropertyShapeInteger['value'];
	onChange?: (newValue: ItemPropertyShapeInteger['value']) => void;
};
