import { GlobalComponentProps } from 'src/types/components';

export type ItemPropertyWidgetTimezoneOffsetProps = GlobalComponentProps & {
	isEditMode?: boolean;
	defaultValue?: ItemPropertyWidgetTimezoneOffsetState;
	value?: ItemPropertyWidgetTimezoneOffsetState;
	onChange?: (newValue: ItemPropertyWidgetTimezoneOffsetState) => void;
};

export type ItemPropertyWidgetTimezoneOffsetState = {
	sign: string; // '+' or '-'
	time: string; // in 'HH:MM' format
};
