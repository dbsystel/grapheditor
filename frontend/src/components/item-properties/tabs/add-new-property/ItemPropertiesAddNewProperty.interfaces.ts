import { Item, ItemPropertyWithKey } from 'src/models/item';
import { GlobalComponentProps } from 'src/types/components';

export type ItemPropertiesAddNewPropertyProps = GlobalComponentProps & {
	item: Item;
	onPropertyCreate?: (property: ItemPropertyWithKey) => void;
};
