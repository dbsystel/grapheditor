import { ItemPropertyKey, ItemPropertyType } from 'src/models/item';

export type FormItemProperty = {
	key: ItemPropertyKey;
	value: string;
	type: ItemPropertyType;
};

export type FormItemPostProperty = {
	value: string;
	type: ItemPropertyType;
};

export type FormItemPostProperties = Record<string, FormItemPostProperty>;

export type StyleProperties = Record<string, string>;
