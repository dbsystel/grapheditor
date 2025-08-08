import { Item, ItemPropertyWithKey } from 'src/models/item';
import { Node } from 'src/models/node';
import { GlobalComponentProps } from 'src/types/components';

export type ItemPropertiesAddNewPropertyProps = GlobalComponentProps & {
	item: Item;
	onPropertyCreate?: (
		updatedItems: Item,
		property: ItemPropertyWithKey,
		propertyNode: Node
	) => void;
};
