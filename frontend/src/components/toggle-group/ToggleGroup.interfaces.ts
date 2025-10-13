import { GlobalComponentProps } from 'src/types/components';

export type ToggleGroupOption<T = string> = {
	value: T;
	label: string;
	icon: string;
};

export type ToggleGroupProps<T extends string = string> = GlobalComponentProps & {
	options: Array<ToggleGroupOption<T>>;
	value: T;
	onChange: (value: T) => void;
	selectedLabel?: string;
	size?: 'small' | 'medium';
};
