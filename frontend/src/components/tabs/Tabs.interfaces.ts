import { DBTabs } from '@db-ux/react-core-components';
import { ComponentProps } from 'react';
import { GlobalComponentProps } from 'src/types/components';

export type TabsProps = GlobalComponentProps &
	ComponentProps<typeof DBTabs> & {
		onTabChange?: (tabElement: HTMLInputElement, tabIndex: number) => void;
	};
