import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { processItemPropertiesEntries } from 'src/components/item-properties/helpers';
import { ItemPropertiesTable } from 'src/components/item-properties/table/ItemPropertiesTable';
import { ItemPropertiesTableEntries } from 'src/components/item-properties/table/ItemPropertiesTable.interfaces';
import { ItemPropertiesAddNewProperty } from 'src/components/item-properties/tabs/add-new-property/ItemPropertiesAddNewProperty';
import { TabItem } from 'src/components/tab-item/TabItem';
import { TabList } from 'src/components/tab-list/TabList';
import { TabPanel } from 'src/components/tab-panel/TabPanel';
import { Tabs } from 'src/components/tabs/Tabs';
import { ItemPropertyKey, ItemPropertyWithKey } from 'src/models/item';
import { useItemsStore } from 'src/stores/items';
import { ItemPropertiesProps } from './ItemProperties.interfaces';

export const ItemProperties = ({
	item,
	onPropertyRowMouseEnter,
	onPropertyRowMouseLeave,
	metaData,
	filterMetaByNodeIds,
	id,
	className,
	testId
}: ItemPropertiesProps) => {
	const { t } = useTranslation();
	const rootElementClassName = clsx('item-properties', className);
	// splitting this state into multiple states and batching their update would
	// sometimes cause React not to rerender the component although one of the states
	// was updated (this behaviour would happen rarely, every ~15/20 times)
	const [entriesState, setEntriesState] = useState<{
		complete: ItemPropertiesTableEntries;
		top: ItemPropertiesTableEntries;
		renderIncompleteTab: boolean;
	}>({
		complete: [],
		top: [],
		renderIncompleteTab: false
	});
	const [renderKey, setRenderKey] = useState('');
	const topEntriesPropertyKeysCacheRef = useRef<Array<ItemPropertyKey>>([]);
	// -1 = none
	const tabsActiveIndexRef = useRef(-1);
	const getNodesAsync = useItemsStore((store) => store.getNodesAsync);
	const propsStorageRef = useRef({
		metaData: metaData,
		filterMetaByNodeIds: filterMetaByNodeIds,
		item: item
	});

	useEffect(() => {
		/**
		 * Prevent stale closures.
		 * Asynchronous function creates a closure that captures the variables at the time of its creation. If React re-renders after
		 * the async function has been created but before it finishes execution, the values used inside the async function don't update,
		 * they remain "stale".
		 */
		propsStorageRef.current = {
			metaData: metaData,
			filterMetaByNodeIds: filterMetaByNodeIds,
			item: item
		};

		const processTableEntries = async () => {
			const { metaData, filterMetaByNodeIds, item } = propsStorageRef.current;
			const propertyNodes = await getNodesAsync(Object.keys(item.properties));

			const { newCompleteEntries, newIncompleteEntries, newTopEntries } =
				processItemPropertiesEntries({
					propertyNodes: propertyNodes,
					metaData: metaData,
					filterMetaByNodeIds: filterMetaByNodeIds,
					item: item,
					topEntriesPropertyKeys: topEntriesPropertyKeysCacheRef.current
				});

			const renderIncompleteTab =
				tabsActiveIndexRef.current === 1 && newIncompleteEntries.length;

			const topTableEntries = renderIncompleteTab ? newIncompleteEntries : newTopEntries;

			setEntriesState({
				top: topTableEntries,
				complete: newCompleteEntries,
				renderIncompleteTab: newIncompleteEntries.length > 0
			});
		};

		processTableEntries();
	}, [item, renderKey, metaData, filterMetaByNodeIds]);

	const onPropertyCreate = (property: ItemPropertyWithKey) => {
		topEntriesPropertyKeysCacheRef.current.push(property.key);
	};

	// sort as sort into complete/incomplete columns, not sort alphabetically
	// or similar
	const sortTopEntriesMap = (keepActiveTabIndex?: boolean) => {
		if (!keepActiveTabIndex) {
			tabsActiveIndexRef.current = -1;
		}

		topEntriesPropertyKeysCacheRef.current = [];
		setRenderKey(window.crypto.randomUUID());
	};

	const onTabChange = (tabElement: HTMLInputElement, tabIndex: number) => {
		tabsActiveIndexRef.current = tabIndex;
		sortTopEntriesMap(true);
	};

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<Tabs initialSelectedMode="manually" onTabChange={onTabChange}>
				<TabList>
					<TabItem icon="plus">{t('tab_title_new_property')}</TabItem>
					{entriesState.renderIncompleteTab && (
						<TabItem icon="exclamation_mark_circle">
							{t('tab_title_missing_properties')}
						</TabItem>
					)}
				</TabList>
				<TabPanel onTabClose={sortTopEntriesMap}>
					<ItemPropertiesAddNewProperty item={item} onPropertyCreate={onPropertyCreate} />
				</TabPanel>
			</Tabs>

			<ItemPropertiesTable
				topEntries={entriesState.top}
				entries={entriesState.complete}
				onPropertyRowMouseEnter={onPropertyRowMouseEnter}
				onPropertyRowMouseLeave={onPropertyRowMouseLeave}
			/>
		</div>
	);
};
