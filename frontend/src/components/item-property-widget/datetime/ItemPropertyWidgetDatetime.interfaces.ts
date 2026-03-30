import { ItemPropertyShapeDatetime } from 'src/models/item';
import { GlobalComponentProps } from 'src/types/components';

export type ItemPropertyWidgetDatetimeProps = GlobalComponentProps & {
	isEditMode?: boolean;
	defaultValue?: ItemPropertyShapeDatetime['value'];
	value?: ItemPropertyShapeDatetime['value'];
	onChange?: (newValue: ItemPropertyShapeDatetime['value']) => void;
};

export type ItemPropertyWidgetDatetimeState = {
	datetime: string;
	fractionOfSecond: string;
	timezoneOffsetSign: string;
	timezoneOffset: string;
};
