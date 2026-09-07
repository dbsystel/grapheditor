import { ItemProperty, ItemPropertyKey } from 'src/models/item';
import { Node } from 'src/models/node';

export type NewPropertyEntry = { property: ItemProperty; node?: Node };
export type NewPropertiesMap = Record<ItemPropertyKey, NewPropertyEntry>;
