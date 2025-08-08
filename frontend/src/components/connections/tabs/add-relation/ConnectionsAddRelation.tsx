import { DBDivider } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AddRelationForm } from 'src/components/add-relation-form/AddRelationForm';
import { TabItem } from 'src/components/tab-item/TabItem';
import { TabList } from 'src/components/tab-list/TabList';
import { TabPanel } from 'src/components/tab-panel/TabPanel';
import { Tabs } from 'src/components/tabs/Tabs';
import { ConnectionsAddRelationProps } from './ConnectionsAddRelation.interfaces';

export const ConnectionsAddRelation = ({
	id,
	className,
	testId,
	refItem,
	onSave,
	onTabClose
}: ConnectionsAddRelationProps) => {
	const { t } = useTranslation();
	const rootElementClassName = clsx('connections__add-relation', className);
	const tabsActiveIndexRef = useRef(-1);

	const onTabChange = (tabElement: HTMLInputElement, tabIndex: number) => {
		tabsActiveIndexRef.current = tabIndex;
	};

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<Tabs initialSelectedMode="manually" onTabChange={onTabChange}>
				<TabList>
					<TabItem icon="plus">{t('add_relation')}</TabItem>
					<DBDivider />
				</TabList>

				<TabPanel onTabClose={onTabClose} className="db-bg-color-basic-level-2">
					<AddRelationForm refNode={refItem} onSave={onSave} />
				</TabPanel>
			</Tabs>
		</div>
	);
};
