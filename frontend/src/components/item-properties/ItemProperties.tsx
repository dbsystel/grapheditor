import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	changePropertyType,
	deleteProperty,
	processItemPropertiesEntries
} from 'src/components/item-properties/helpers';
import { ItemPropertiesTable } from 'src/components/item-properties/table/ItemPropertiesTable';
import { ItemPropertiesTableEntries } from 'src/components/item-properties/table/ItemPropertiesTable.interfaces';
import { ItemPropertiesAddNewProperty } from 'src/components/item-properties/tabs/add-new-property/ItemPropertiesAddNewProperty';
import { TabItem } from 'src/components/tab-item/TabItem';
import { TabList } from 'src/components/tab-list/TabList';
import { TabPanel } from 'src/components/tab-panel/TabPanel';
import { Tabs } from 'src/components/tabs/Tabs';
import { Item, ItemPropertyKey, ItemPropertyType, ItemPropertyWithKey } from 'src/models/item';
import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { useItemsStore } from 'src/stores/items';
import { isNode } from 'src/utils/helpers/nodes';
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

	const onPropertyCreate = (
		updatedItem: Item,
		property: ItemPropertyWithKey,
		propertyNode: Node
	) => {
		topEntriesPropertyKeysCacheRef.current.push(property.key);
		updateStores([updatedItem, propertyNode]);
	};

	const onPropertyEdit = (
		updatedItem: Item,
		property: ItemPropertyWithKey,
		propertyNode: Node
	) => {
		updateStores([updatedItem, propertyNode]);
	};

	const onPropertyDelete = (updatedItem: Item) => {
		updateStores([updatedItem]);
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

	const updateStores = (updatedItems: Array<Item>) => {
		if (updatedItems.length) {
			let rerenderAtNodeNumber = 0;

			updatedItems.forEach((updateItem) => {
				if (isNode(updateItem)) {
					rerenderAtNodeNumber += 1;
				}
			});

			updatedItems.forEach((updatedItem, index) => {
				if (isNode(updatedItem)) {
					// use "index + 1 < rerenderAtNodeNumber" to update items store only once
					useItemsStore.getState().setNode(updatedItem, index + 1 < rerenderAtNodeNumber);
				} else {
					useItemsStore.getState().setRelation(updatedItem);
				}
			});
		}
	};

	const localOnPropertyDelete = (item: Node | Relation, property: ItemPropertyWithKey) => {
		deleteProperty(item, property, onPropertyDelete);
	};

	const onPropertyTypeChange = (
		item: Node | Relation,
		property: ItemPropertyWithKey,
		propertyType: ItemPropertyType
	) => {
		changePropertyType(item, property, propertyType, onPropertyEdit);
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
				onPropertyEdit={onPropertyEdit}
				onPropertyDelete={localOnPropertyDelete}
				onPropertyTypeChange={onPropertyTypeChange}
				onPropertyRowMouseEnter={onPropertyRowMouseEnter}
				onPropertyRowMouseLeave={onPropertyRowMouseLeave}
			/>
		</div>
	);
};
