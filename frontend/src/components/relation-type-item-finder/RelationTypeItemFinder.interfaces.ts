import { ItemFinderProps } from 'src/components/item-finder/ItemFinder.interfaces';
import { Node, NodeId } from 'src/models/node';
import { GlobalComponentProps } from 'src/types/components';

export type RelationTypeItemFinderProps = GlobalComponentProps & {
	invalidMessage?: ItemFinderProps['invalidMessage'];
	semantic?: ItemFinderProps['semantic'];
	variant?: ItemFinderProps['variant'];
	onChange?: ItemFinderProps['onChange'];
	onInput?: (searchTerm: string, matchingTypes: Array<Node>) => void;
	label?: ItemFinderProps['label'];
	placeholder?: ItemFinderProps['placeholder'];
	defaultValue?: Node;
	defaultInputValue?: ItemFinderProps['defaultInputValue'];
	inputValue?: ItemFinderProps['inputValue'];
	value?: Node | null;
	onEnterKey?: (searchTerm: string, matchingTypes: Array<Node>) => void;
	sourceId?: NodeId;
	targetId?: NodeId;
	shouldPreventAddingOptionOnEnter?: boolean;
	shouldShowNoInputMatchTooltip?: boolean;
	/**
	 * Forwarded to the underlying "ItemFinder". Renders a clear (X) button once an option
	 * is selected. See "ItemFinder" for the controlled vs. uncontrolled reset contract:
	 * when controlled (a "value" is provided), "onReset" must be supplied to clear it.
	 */
	allowReset?: ItemFinderProps['allowReset'];
	/** Optional tooltip text for the clear button. Falls back to a translation key. */
	resetTooltipText?: ItemFinderProps['resetTooltipText'];
	/** Called after the selection has been cleared via the clear button. */
	onReset?: ItemFinderProps['onReset'];
};
