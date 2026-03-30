import { ItemProperty, ItemPropertyKey } from 'src/models/item';
import { Node } from 'src/models/node';
import { GlobalComponentProps } from 'src/types/components';

export type ItemPropertiesTableProps = GlobalComponentProps & {
	entries: Array<ItemPropertiesTableEntryWithTopFlag>;
	areTopEntriesMissingProperties: boolean;
	onPropertyRowMouseEnter?: (entry: ItemPropertiesTableEntryWithTopFlag) => void;
	onPropertyRowMouseLeave?: (entry: ItemPropertiesTableEntryWithTopFlag) => void;
	onPropertyChange: (key: ItemPropertyKey, updatedProperty: ItemProperty, index?: number) => void;
	handlePropertyDelete: (key: ItemPropertyKey) => void;
	// newType is string because it can be list_<type> (easier to handle that way)
	handlePropertyTypeChange?: (key: ItemPropertyKey, newType: string) => void;
	isEditMode?: boolean;
	// optional prefix to add to property's value widget so it can remount
	propertyKeyPrefix?: string;
};

export type ItemPropertiesTableEntries = Array<ItemPropertiesTableEntry>;

// Index 0 = Node or Relation property
// Index 1 = the property key
// Index 2 = Node presentation of the property
export type ItemPropertiesTableEntry = [ItemProperty, ItemPropertyKey, Node];

// the same as above, but with additional index indicating if the entry
// should be treated as top entry or not
export type ItemPropertiesTableEntryWithTopFlag = [...ItemPropertiesTableEntry, boolean];
