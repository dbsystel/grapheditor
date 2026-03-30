import { ReactNode } from 'react';
import { ItemPropertyShapeList } from 'src/models/item';
import { GlobalComponentProps } from 'src/types/components';

export type ItemPropertyWidgetListProps = GlobalComponentProps & {
	isEditMode?: boolean;
	defaultValue?: ItemPropertyShapeList['value'];
	value?: ItemPropertyShapeList['value'];
	onChange?: (newValue: ItemPropertyShapeList['value']) => void;
	leadingElement?: (listIndex?: number) => ReactNode;
	trailingElement?: (listIndex?: number) => ReactNode;
};
