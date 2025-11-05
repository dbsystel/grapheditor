import { ItemPropertyWithKey } from 'src/models/item';
import { Node } from 'src/models/node';
import { GlobalComponentProps } from 'src/types/components';

export type ItemPropertiesAddNewPropertyProps = GlobalComponentProps & {
	onPropertyCreate: (property: ItemPropertyWithKey, propertyNode: Node) => void;
};
