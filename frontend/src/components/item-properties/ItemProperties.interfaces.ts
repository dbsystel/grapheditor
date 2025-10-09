import { RefObject } from 'react';
import { ItemPropertiesTableProps } from 'src/components/item-properties/table/ItemPropertiesTable.interfaces';
import { Item, ItemProperties } from 'src/models/item';
import { MetaForMeta, NodeId } from 'src/models/node';
import { GlobalComponentProps } from 'src/types/components';

export type ItemPropertiesProps = GlobalComponentProps & ItemPropertiesBase;

type ItemPropertiesBase = {
	item: Item;
	onPropertyRowMouseEnter?: ItemPropertiesTableProps['onPropertyRowMouseEnter'];
	onPropertyRowMouseLeave?: ItemPropertiesTableProps['onPropertyRowMouseLeave'];
	metaData?: MetaForMeta;
	filterMetaByNodeIds?: Array<NodeId>;
	isEditMode?: boolean;
	handleRef?: RefObject<ItemPropertiesHandle>;
};

export type ItemPropertiesHandle = {
	handleSave: () => Promise<void>;
	handleUndo: () => void;
	properties: ItemProperties;
} | null;
