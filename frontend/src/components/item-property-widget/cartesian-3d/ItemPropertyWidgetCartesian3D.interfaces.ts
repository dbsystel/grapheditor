import { ItemPropertyShapeCartesian3D } from 'src/models/item';
import { GlobalComponentProps } from 'src/types/components';

export type ItemPropertyWidgetCartesian3DProps = GlobalComponentProps & {
	isEditMode?: boolean;
	defaultValue?: ItemPropertyShapeCartesian3D['value'];
	value?: ItemPropertyShapeCartesian3D['value'];
	onChange?: (newValue: ItemPropertyShapeCartesian3D['value']) => void;
};
