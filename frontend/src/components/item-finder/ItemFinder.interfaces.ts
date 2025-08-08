import { LabelVariantType, SemanticType } from '@db-ux/react-core-components/dist/shared/model';
import { Node } from 'src/models/node';
import { GlobalComponentProps } from 'src/types/components';

export type ItemFinderProps<T extends Node, TMultiple = boolean> = GlobalComponentProps & {
	defaultInputValue?: string;
	inputValue?: string;
	onInput?: (input: string) => void;
	onChange?: (item: T, isItemSelected: boolean, selectedItems: Array<T>) => void;
	onEnterKey?: (searchTerm: string) => void;
	value?: (TMultiple extends true ? Array<T> : T) | null;
	searchTimeoutMilliseconds?: number;
	label?: string;
	validMessage?: string;
	invalidMessage?: string;
	isMultiselect?: TMultiple;
	isDisabled?: boolean;
	semantic?: SemanticType;
	variant?: LabelVariantType;
	options: Array<T>;
	defaultSelectedOptions?: Array<T>;
	placeholder?: string;
	hideBadges?: boolean;
};
