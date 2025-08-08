import { ChangeEvent } from 'react';
import { Item, ItemPropertyWithKey } from 'src/models/item';

export type ItemPropertiesEditPropertyValueProps = {
	item: Item;
	property: ItemPropertyWithKey;
	onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
};
