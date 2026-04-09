import { PropsWithChildren, ReactNode } from 'react';
import { GlobalComponentProps } from 'src/types/components';

type SidebarCommon = GlobalComponentProps &
	PropsWithChildren & {
		headerContent?: ReactNode;
		shouldHideCloseButton?: boolean;
		direction?: 'left' | 'right';
		defaultIsCollapsed?: boolean;
		onCollapse?: () => void;
		onExpand?: () => void;
		onCloseButtonClick?: () => void;
	};

type SidebarBase = SidebarCommon & {
	isHorizontalResizeable?: false;
	sidebarId?: string;
};

type SidebarWithHorizontalResize = SidebarCommon & {
	isHorizontalResizeable: true;
	sidebarId: string;
};

export type SidebarProps = SidebarBase | SidebarWithHorizontalResize;
