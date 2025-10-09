import { ItemPropertyWithKey } from 'src/models/item';
import { GlobalComponentProps } from 'src/types/components';

export type ItemPropertiesAddNewPropertyProps = GlobalComponentProps & {
	onPropertyCreate: (property: ItemPropertyWithKey) => void;
};
