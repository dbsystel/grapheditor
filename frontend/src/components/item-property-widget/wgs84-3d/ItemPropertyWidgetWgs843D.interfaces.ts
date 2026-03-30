import { ItemPropertyShapeWgs8423D } from 'src/models/item';
import { GlobalComponentProps } from 'src/types/components';

export type ItemPropertyWidgetWgs843DProps = GlobalComponentProps & {
	isEditMode?: boolean;
	defaultValue?: ItemPropertyShapeWgs8423D['value'];
	value?: ItemPropertyShapeWgs8423D['value'];
	onChange?: (newValue: ItemPropertyShapeWgs8423D['value']) => void;
};
