import './TabItem.scss';
import { DBTabItem } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useRef } from 'react';
import { TabItemProps } from './TabItem.interfaces';

export const TabItem = ({ testId, className, ...rest }: TabItemProps) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const rootElementClassName = clsx('tab-item', className);

	return (
		<DBTabItem {...rest} ref={inputRef} data-testid={testId} className={rootElementClassName} />
	);
};
