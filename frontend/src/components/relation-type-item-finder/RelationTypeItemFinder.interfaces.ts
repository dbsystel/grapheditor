import { ItemFinderProps } from 'src/components/item-finder/ItemFinder.interfaces';
import { Node } from 'src/models/node';
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
	value?: Node;
	onEnterKey?: (searchTerm: string, matchingTypes: Array<Node>) => void;
	additionalOptions?: Array<Node>;
};
