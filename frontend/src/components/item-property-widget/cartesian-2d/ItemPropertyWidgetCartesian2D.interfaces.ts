import { ItemPropertyShapeCartesian2D } from 'src/models/item';
import { GlobalComponentProps } from 'src/types/components';

export type ItemPropertyWidgetCartesian2DProps = GlobalComponentProps & {
	isEditMode?: boolean;
	defaultValue?: ItemPropertyShapeCartesian2D['value'];
	value?: ItemPropertyShapeCartesian2D['value'];
	onChange?: (newValue: ItemPropertyShapeCartesian2D['value']) => void;
};
