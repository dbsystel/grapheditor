import { ItemPropertyShapeWgs8422D } from 'src/models/item';
import { GlobalComponentProps } from 'src/types/components';

export type ItemPropertyWidgetWgs842DProps = GlobalComponentProps & {
	isEditMode?: boolean;
	defaultValue?: ItemPropertyShapeWgs8422D['value'];
	value?: ItemPropertyShapeWgs8422D['value'];
	onChange?: (newValue: ItemPropertyShapeWgs8422D['value']) => void;
};
