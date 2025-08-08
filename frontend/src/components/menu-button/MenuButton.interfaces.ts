import { IconTypes } from '@db-ux/core-foundations';
import { PlacementType, SizeType } from '@db-ux/react-core-components/dist/shared/model';
import { ReactNode } from 'react';
import { GlobalComponentProps } from 'src/types/components';

export type MenuButtonProps = GlobalComponentProps & {
	buttonSize?: SizeType;
	optionsPlacement?: PlacementType;
	options: Array<MenuButtonOption>;
	icon?: IconTypes;
};

export type MenuButtonOption = Pick<
	MenuButtonProps,
	'buttonSize' | 'className' | 'optionsPlacement'
> & {
	title: ReactNode;
	// render title "as is" since we wrap it with other component(s) by default
	shouldRenderTitleAsIs?: boolean;
	icon?: IconTypes;
	isDisabled?: boolean;
	onClick?: () => void;
	options?: Array<MenuButtonOption>;
};

export type MenuButtonOptionsContentProps = {
	options: Array<MenuButtonOption>;
};
