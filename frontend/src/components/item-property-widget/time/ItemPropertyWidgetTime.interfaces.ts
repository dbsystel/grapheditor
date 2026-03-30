import { ItemPropertyShapeTime } from 'src/models/item';
import { GlobalComponentProps } from 'src/types/components';

export type ItemPropertyWidgetTimeProps = GlobalComponentProps & {
	isEditMode?: boolean;
	defaultValue?: ItemPropertyShapeTime['value'];
	value?: ItemPropertyShapeTime['value'];
	onChange?: (newValue: ItemPropertyShapeTime['value']) => void;
};

export type ItemPropertyWidgetTimeState = {
	time: string;
	fractionOfSecond: string;
	timezoneOffsetSign: string;
	timezoneOffset: string;
};
