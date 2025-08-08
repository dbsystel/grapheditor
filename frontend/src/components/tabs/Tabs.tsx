import { DBTabs } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { TabsProps } from './Tabs.interfaces';

export const Tabs = ({ onTabChange, className, testId, ...rest }: TabsProps) => {
	const tabsRef = useRef<HTMLDivElement | null>(null);
	const rootElementClassName = clsx('tabs', className);

	// fix for https://github.com/db-ux-design-system/core-web/issues/3595
	useEffect(() => {
		let radioInputs: NodeListOf<HTMLInputElement> | null = null;

		const onTabChangeCallback = (event: Event) => {
			let selectedRadioInputIndex = -1;
			const eventTarget = event.target;

			if (radioInputs) {
				Array.from(radioInputs).forEach((radioInput, index) => {
					const isSelectedRadioInput = radioInput === eventTarget;

					if (!isSelectedRadioInput) {
						radioInput.checked = false;
					} else {
						selectedRadioInputIndex = index;
					}

					return isSelectedRadioInput;
				});

				if (eventTarget && onTabChange) {
					onTabChange(radioInputs[selectedRadioInputIndex], selectedRadioInputIndex);
				}
			}
		};

		if (tabsRef.current && onTabChange) {
			const tabsList = tabsRef.current.querySelector('[role="tablist"]');

			if (tabsList) {
				radioInputs = tabsList.querySelectorAll<HTMLInputElement>('input[type="radio"]');

				radioInputs.forEach((radioInput) => {
					radioInput.addEventListener('change', onTabChangeCallback);
				});
			}
		}

		return () => {
			if (radioInputs) {
				radioInputs.forEach((radioInput) => {
					radioInput.removeEventListener('change', onTabChangeCallback);
				});
			}
		};
	}, [onTabChange]);

	return <DBTabs {...rest} className={rootElementClassName} ref={tabsRef} data-testid={testId} />;
};
