import { Item } from 'src/models/item';
import { GlobalComponentProps } from 'src/types/components';

export type ItemCenterButtonProps = GlobalComponentProps & {
	item: Item;
	isDisabled?: boolean;
};
