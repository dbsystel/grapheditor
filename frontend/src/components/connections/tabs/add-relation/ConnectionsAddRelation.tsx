import clsx from 'clsx';
import { useState } from 'react';
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
	const [activeTabIndex, setActiveTabIndex] = useState(-1);
	const rootElementClassName = clsx('connections__add-relation', className);

	const onIndexChange = (tabIndex: number) => {
		setActiveTabIndex(tabIndex);
	};

	const localOnTabClose = () => {
		setActiveTabIndex(-1);
		onTabClose();
	};

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<Tabs activeIndex={activeTabIndex} onIndexChange={onIndexChange}>
				<TabList>
					<TabItem icon="plus">{t('add_relation')}</TabItem>
				</TabList>

				<TabPanel onTabClose={localOnTabClose} className="db-bg-color-basic-level-2">
					<AddRelationForm refNode={refItem} onSave={onSave} />
				</TabPanel>
			</Tabs>
		</div>
	);
};
