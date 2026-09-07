import { LabelVariantType, SemanticType } from '@db-ux/react-core-components/dist/shared/model';
import { FocusEvent } from 'react';
import { Node } from 'src/models/node';
import { GlobalComponentProps } from 'src/types/components';

type ItemFinderBaseProps = GlobalComponentProps & {
	defaultInputValue?: string;
	inputValue?: string;
	// TODO onInput should pass the whole event, not just the input value
	onInput?: (input: string) => void;
	onInputFocus?: (event: FocusEvent<HTMLInputElement>) => void;
	onInputBlur?: (event: FocusEvent<HTMLInputElement>) => void;
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
	optionDelimiterAfterIndexes?: Array<number>;
	// flag for indicating there are more options than shown
	hasMoreOptions?: boolean;
	placeholder?: string;
	hideBadges?: boolean;
	noInputMatchTooltip?: string;
	shouldShowNoInputMatchTooltip?: boolean;
	/**
	 * When true, a clear (X) button is rendered once an option is selected. Clicking it
	 * clears the current selection and the input value.
	 *
	 * Controlled vs. uncontrolled contract (documented, not enforced by the type system):
	 * - Uncontrolled (no "value" prop): the component clears its own internal state, so
	 *   "onReset" is purely an optional notification callback.
	 * - Controlled (a "value" prop is provided): the parent owns "value", so it MUST also
	 *   provide "onReset" and null out the controlled "value" there — the component cannot
	 *   clear a parent-owned "value" on its own.
	 */
	allowReset?: boolean;
	/** Optional tooltip text for the clear button. Falls back to a translation key. */
	resetTooltipText?: string;
	/** Called after the selection has been cleared via the clear button. */
	onReset?: () => void;
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
