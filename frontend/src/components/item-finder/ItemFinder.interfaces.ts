import { LabelVariantType, SemanticType } from '@db-ux/react-core-components/dist/shared/model';
import { Node } from 'src/models/node';
import { GlobalComponentProps } from 'src/types/components';

type ItemFinderBaseProps = GlobalComponentProps & {
	defaultInputValue?: string;
	inputValue?: string;
	onInput?: (input: string) => void;
	onChange?: (item: Node, isItemSelected: boolean, selectedItems: Array<Node>) => void;
	onEnterKey?: (searchTerm: string) => void;
	searchTimeoutMilliseconds?: number;
	label?: string;
	validMessage?: string;
	invalidMessage?: string;
	isDisabled?: boolean;
	semantic?: SemanticType;
	variant?: LabelVariantType;
	options: Array<Node>;
	placeholder?: string;
	hideBadges?: boolean;
	noInputMatchTooltip?: string;
};

type ItemFinderSingleProps = ItemFinderBaseProps & {
	isMultiselect?: false;
	value?: Node | null;
	defaultValue?: Node | null;
};

type ItemFinderMultiProps = ItemFinderBaseProps & {
	isMultiselect: true;
	value?: Array<Node> | null;
	defaultValue?: Array<Node> | null;
};

export type ItemFinderProps = ItemFinderSingleProps | ItemFinderMultiProps;
