import { ChangeEvent } from 'react';
import { ItemPropertyWithKey } from 'src/models/item';

export type ItemPropertiesEditPropertyValueProps = {
	property: ItemPropertyWithKey;
	onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
	isEditMode?: boolean;
};
