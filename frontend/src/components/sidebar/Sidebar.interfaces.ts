import { PropsWithChildren, ReactNode } from 'react';
import { GlobalComponentProps } from 'src/types/components';

export type SidebarProps = GlobalComponentProps &
	PropsWithChildren & {
		headerContent?: ReactNode;
		shouldHideCloseButton?: boolean;
		direction?: 'left' | 'right';
		defaultIsCollapsed?: boolean;
		onCollapse?: () => void;
		onExpand?: () => void;
		onCloseButtonClick?: () => void;
	};
