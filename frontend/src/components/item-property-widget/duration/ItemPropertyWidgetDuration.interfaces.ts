import { ItemPropertyShapeDuration } from 'src/models/item';
import { GlobalComponentProps } from 'src/types/components';

export type ItemPropertyWidgetDurationProps = GlobalComponentProps & {
	isEditMode?: boolean;
	defaultValue?: ItemPropertyShapeDuration['value'];
	value?: ItemPropertyShapeDuration['value'];
	onChange?: (updatedProperty: ItemPropertyShapeDuration['value']) => void;
};
