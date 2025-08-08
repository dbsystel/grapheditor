import { ItemFinderProps } from 'src/components/item-finder/ItemFinder.interfaces';
import { Node } from 'src/models/node';
import { GlobalComponentProps } from 'src/types/components';

export type RelationTypeItemFinderProps = GlobalComponentProps & {
	invalidMessage?: ItemFinderProps<Node>['invalidMessage'];
	semantic?: ItemFinderProps<Node>['semantic'];
	variant?: ItemFinderProps<Node>['variant'];
	onChange?: ItemFinderProps<Node>['onChange'];
	onInput?: (searchTerm: string, matchingTypes: Array<Node>) => void;
	label?: ItemFinderProps<Node>['label'];
	placeholder?: ItemFinderProps<Node>['placeholder'];
	defaultSelectedOptions?: ItemFinderProps<Node>['defaultSelectedOptions'];
	defaultInputValue?: ItemFinderProps<Node>['defaultInputValue'];
	inputValue?: ItemFinderProps<Node>['inputValue'];
	value?: ItemFinderProps<Node>['value'];
	onEnterKey?: (searchTerm: string, matchingTypes: Array<Node>) => void;
};
