import './TabList.scss';
import { DBTabList } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { TabListProps } from './TabList.interfaces';

export const TabList = ({ className, testId, ...rest }: TabListProps) => {
	const rootElementClassName = clsx('tab-list', className);

	return <DBTabList {...rest} className={rootElementClassName} data-testid={testId} />;
};
