import { DBTabs } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useRef } from 'react';
import { TabsProps } from './Tabs.interfaces';

export const Tabs = ({ className, testId, ...rest }: TabsProps) => {
	const tabsRef = useRef<HTMLDivElement | null>(null);
	const rootElementClassName = clsx('tabs', className);

	return <DBTabs {...rest} className={rootElementClassName} ref={tabsRef} data-testid={testId} />;
};
