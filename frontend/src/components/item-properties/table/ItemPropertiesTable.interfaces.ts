import { ItemPropertyKey, ItemPropertyWithKey } from 'src/models/item';
import { Node } from 'src/models/node';
import { GlobalComponentProps } from 'src/types/components';

export type ItemPropertiesTableProps = GlobalComponentProps & {
	entries: ItemPropertiesTableEntries;
	topEntries?: ItemPropertiesTableEntries;
	areTopEntriesMissingProperties: boolean;
	onPropertyRowMouseEnter?: (propertyWithKey: ItemPropertyWithKey, propertyNode: Node) => void;
	onPropertyRowMouseLeave?: (propertyWithKey: ItemPropertyWithKey, propertyNode: Node) => void;
	onPropertyChange: (key: ItemPropertyKey, value: string) => void;
	onPropertyDelete: (key: ItemPropertyKey) => void;
	isEditMode?: boolean;
};

export type ItemPropertiesTableEntries = Array<ItemPropertiesTableEntry>;

// Index 0 = Node or Relation that the property belongs to
// Index 1 = the property itself, extended with its key
// Index 2 = Node presentation of the property
export type ItemPropertiesTableEntry = [ItemPropertyWithKey, Node];

// the same as above, but with additional index indicating if the entry
// should be treated as top entry or not (not sure if
export type ItemPropertiesTableEntryWithTopFlag = [...ItemPropertiesTableEntry, boolean];
