import { GlobalComponentProps } from 'src/types/components';

export type ItemPropertyWidgetFractionOfSecondProps = GlobalComponentProps & {
	isEditMode?: boolean;
	defaultValue?: string;
	value?: string;
	onChange?: (newValue: string) => void;
};
