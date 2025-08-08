import { Item, ItemPropertyType, ItemPropertyWithKey } from 'src/models/item';
import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { GlobalComponentProps } from 'src/types/components';

export type ItemPropertiesTableProps = GlobalComponentProps & {
	entries: ItemPropertiesTableEntries;
	topEntries?: ItemPropertiesTableEntries;
	onPropertyRowMouseEnter?: (
		item: Item,
		propertyWithKey: ItemPropertyWithKey,
		propertyNode: Node
	) => void;
	onPropertyRowMouseLeave?: (
		item: Item,
		propertyWithKey: ItemPropertyWithKey,
		propertyNode: Node
	) => void;
	onPropertyEdit?: (updatedItem: Item, property: ItemPropertyWithKey, propertyNode: Node) => void;
	onPropertyDelete: (item: Node | Relation, property: ItemPropertyWithKey) => void;
	onPropertyTypeChange: (
		item: Node | Relation,
		property: ItemPropertyWithKey,
		propertyType: ItemPropertyType
	) => void;
};

export type ItemPropertiesTableEntries = Array<ItemPropertiesTableEntry>;

// Index 0 = Node or Relation that the property belongs to
// Index 1 = the property itself, extended with its key
// Index 2 = Node presentation of the property
export type ItemPropertiesTableEntry = [Node | Relation, ItemPropertyWithKey, Node];

// the same as above, but with additional index indicating if the entry
// should be treated as top entry or not (not sure if
export type ItemPropertiesTableEntryWithTopFlag = [...ItemPropertiesTableEntry, boolean];
