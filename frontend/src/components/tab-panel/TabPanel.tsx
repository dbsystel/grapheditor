import './TabPanel.scss';
import { DBTabPanel } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useRef } from 'react';
import { TabPanelProps } from './TabPanel.interfaces';

export const TabPanel = ({ children, onTabClose, className, testId, ...rest }: TabPanelProps) => {
	const rootElementClassName = clsx('tab-panel db-bg-color-basic-level-2', className);
	const ref = useRef<HTMLDivElement | null>(null);

	return (
		<DBTabPanel {...rest} className={rootElementClassName} ref={ref} data-testid={testId}>
			<div className="tab-panel__content-wrapper">
				<div className="tab-panel__content">{children}</div>
				<span className="tab-panel__close" data-icon="cross" onClick={onTabClose} />
			</div>
		</DBTabPanel>
	);
};
