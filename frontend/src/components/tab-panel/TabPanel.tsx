import './TabPanel.scss';
import { DBTabPanel } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useRef } from 'react';
import { TabPanelProps } from './TabPanel.interfaces';

// TODO check if https://github.com/db-ui/mono/issues/3548 is resolved, refactor
// the component afterwards
export const TabPanel = ({ children, onTabClose, className, testId, ...rest }: TabPanelProps) => {
	const rootElementClassName = clsx('tab-panel db-bg-color-basic-level-2', className);
	const ref = useRef<HTMLDivElement | null>(null);

	// fix for always showing one DBTabPanel
	const onClose = () => {
		const tabRadioInput = document.querySelector(
			`input[id="${ref.current?.getAttribute('aria-labelledby') || ''}"]`
		);

		if (tabRadioInput && 'checked' in tabRadioInput) {
			tabRadioInput.checked = false;

			if (onTabClose) {
				onTabClose();
			}
		}
	};

	return (
		<DBTabPanel {...rest} className={rootElementClassName} ref={ref} data-testid={testId}>
			<div className="tab-panel__content-wrapper">
				<div className="tab-panel__content">{children}</div>
				<span className="tab-panel__close" data-icon="cross" onClick={onClose} />
			</div>
		</DBTabPanel>
	);
};
