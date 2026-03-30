import clsx from 'clsx';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AddNewProperty } from 'src/components/add-new-property/AddNewProperty';
import {
	processItemPropertiesEntries,
	PropertiesStorageClass,
	showNotificationForInvalidProperties
} from 'src/components/item-properties/helpers';
import { ItemPropertiesTable } from 'src/components/item-properties-table/ItemPropertiesTable';
import {
	ItemPropertiesTableEntries,
	ItemPropertiesTableEntryWithTopFlag
} from 'src/components/item-properties-table/ItemPropertiesTable.interfaces';
import { TabItem } from 'src/components/tab-item/TabItem';
import { TabList } from 'src/components/tab-list/TabList';
import { TabPanel } from 'src/components/tab-panel/TabPanel';
import { Tabs } from 'src/components/tabs/Tabs';
import { ItemProperty, ItemPropertyKey } from 'src/models/item';
import { api } from 'src/utils/api/api';
import {
	clone,
	compareTwoStringsForSorting,
	twoObjectValuesAreEqual
} from 'src/utils/helpers/general';
import {
	areItemPropertiesValid,
	convertItemPropertyToNewType,
	getDefaultItemPropertyForItemPropertyType,
	isItemPropertyOfTypeList,
	isItemPropertyTypeValid
} from 'src/utils/helpers/items';
import { isNode } from 'src/utils/helpers/nodes';
import { isRelation } from 'src/utils/helpers/relations';
import { idFormatter } from 'src/utils/id-formatter';
import { ItemPropertiesProps } from './ItemProperties.interfaces';

export const ItemProperties = ({
	item,
	onPropertyRowMouseEnter,
	onPropertyRowMouseLeave,
	metaData,
	filterMetaByNodeIds,
	id,
	className,
	testId,
	isEditMode,
	handleRef
}: ItemPropertiesProps) => {
	const { t } = useTranslation();
	// splitting this state into multiple states and batching their update would
	// sometimes cause React not to rerender the component although one of the states
	// was updated (this behaviour would happen rarely, every ~15/20 times)
	const [entriesState, setEntriesState] = useState<{
		entries: Array<ItemPropertiesTableEntryWithTopFlag>;
		renderIncompleteTab: boolean;
	}>({
		entries: [],
		renderIncompleteTab: false
	});
	const [isLoading, setIsLoading] = useState(false);
	// lazy initialization to prevent creating the PropertiesStorageClass instance on every render
	const [propertiesStorage] = useState(() => new PropertiesStorageClass(clone(item.properties)));
	const tabsActiveIndexRef = useRef(-1); // -1 = none
	const topEntriesPropertyKeysCacheRef = useRef<Array<ItemPropertyKey>>([]);
	const propertyKeyPrefix = useRef(window.crypto.randomUUID());
	const propsStorageRef = useRef({
		metaData: metaData,
		filterMetaByNodeIds: filterMetaByNodeIds,
		itemProperties: clone(item.properties)
	});
	const rootElementClassName = clsx('item-properties', className);

	useImperativeHandle(handleRef, () => ({
		handleSave,
		handleUndo,
		validateProperties
	}));

	useEffect(() => {
		propertiesStorage.setProperties(clone(item.properties));

		return () => {
			propertiesStorage.reset();
		};
	}, [item]);

	useEffect(() => {
		refreshPropsStorageAndProcessTableEntries();
	}, [item, metaData, filterMetaByNodeIds]);

	function refreshPropsStorageAndProcessTableEntries() {
		/**
		 * Prevent stale closures.
		 * Asynchronous function creates a closure that captures the variables at the time of its creation. If React re-renders
		 * after the async function has been created but before it finishes execution, the values used inside the async
		 * function don't update, they remain "stale".
		 */
		propsStorageRef.current = {
			metaData: metaData,
			filterMetaByNodeIds: filterMetaByNodeIds,
			itemProperties: clone(propertiesStorage.properties)
		};

		processTableEntries();
	}

	async function processTableEntries() {
		const { metaData, filterMetaByNodeIds, itemProperties } = propsStorageRef.current;
		const response = await api.nodes.fetch.postNodesBulkFetch({
			nodeIds: Object.keys(itemProperties)
		});
		const propertyNodes = Object.values(response.data.nodes);

		const { newCompleteEntries, newIncompleteEntries, newTopEntries } =
			processItemPropertiesEntries({
				propertyNodes: propertyNodes,
				metaData: metaData,
				filterMetaByNodeIds: filterMetaByNodeIds,
				itemProperties: itemProperties,
				topEntriesPropertyKeys: topEntriesPropertyKeysCacheRef.current
			});

		const renderIncompleteTab = tabsActiveIndexRef.current === 1 && newIncompleteEntries.length;
		const topTableEntries = renderIncompleteTab ? newIncompleteEntries : newTopEntries;
		const topEntries: Array<ItemPropertiesTableEntryWithTopFlag> = sortTableEntriesByNodesTitle(
			topTableEntries
		).map((entry) => [...entry, true]);
		const completeEntries: Array<ItemPropertiesTableEntryWithTopFlag> =
			sortTableEntriesByNodesTitle(newCompleteEntries).map((entry) => [...entry, false]);

		setEntriesState({
			entries: [...topEntries, ...completeEntries],
			renderIncompleteTab: newIncompleteEntries.length > 0
		});
	}

	// sort as sort into complete/incomplete columns, not sort alphabetically or similar
	const sortTopEntriesMap = (keepActiveTabIndex?: boolean) => {
		if (!keepActiveTabIndex) {
			setActiveTabIndex(-1);
		}

		clearTopEntriesCache();
		refreshPropsStorageAndProcessTableEntries();
	};

	const onTabChange = (tabElement: HTMLInputElement, tabIndex: number) => {
		setActiveTabIndex(tabIndex);
		sortTopEntriesMap(true);
	};

	const handleSave = async () => {
		if (!isLoading) {
			const itemPropertiesValidation = areItemPropertiesValid(propertiesStorage.properties);

			if (!itemPropertiesValidation.isValid) {
				showNotificationForInvalidProperties(
					itemPropertiesValidation.invalidKeys.map((key) =>
						idFormatter.parseIdToName(key)
					)
				);

				return false;
			}

			setActiveTabIndex(0);
			clearTopEntriesCache();
			setIsLoading(true);

			const patchObject = {
				id: item.id,
				properties: propertiesStorage.properties
			};

			if (isNode(item)) {
				await api.nodes.actions.patchNodesAndUpdateApplication([patchObject]);
			} else if (isRelation(item)) {
				await api.relations.actions.patchRelationsAndUpdateApplication([patchObject]);
			}

			setIsLoading(false);

			return true;
		}

		return false;
	};

	const handleUndo = () => {
		propertiesStorage.setProperties(clone(item.properties));
		refreshPropertyKeyPrefix();
		setActiveTabIndex(0);
		clearTopEntriesCache();
		refreshPropsStorageAndProcessTableEntries();
	};

	const validateProperties = () => {
		return twoObjectValuesAreEqual(item.properties, propertiesStorage.properties);
	};

	const refreshPropertyKeyPrefix = () => {
		propertyKeyPrefix.current = window.crypto.randomUUID();
	};

	const clearTopEntriesCache = () => {
		topEntriesPropertyKeysCacheRef.current = [];
	};

	const setActiveTabIndex = (tabIndex: number) => {
		tabsActiveIndexRef.current = tabIndex;
	};

	const onPropertyCreate = (key: ItemPropertyKey, property: ItemProperty) => {
		propertiesStorage.setProperty(key, property);

		if (!topEntriesPropertyKeysCacheRef.current.includes(key)) {
			topEntriesPropertyKeysCacheRef.current.push(key);
		} else {
			refreshPropertyKeyPrefix();
		}

		refreshPropsStorageAndProcessTableEntries();
	};

	const onPropertyChange = (key: ItemPropertyKey, updatedProperty: ItemProperty) => {
		propertiesStorage.setProperty(key, updatedProperty);
	};

	const handlePropertyDelete = (key: ItemPropertyKey) => {
		propertiesStorage.deleteProperty(key);
		refreshPropsStorageAndProcessTableEntries();
	};

	// newType is string because it can be list_<type> (easier to handle that way)
	const handlePropertyTypeChange = (key: ItemPropertyKey, newType: string) => {
		const mainType = newType.startsWith('list_') ? 'list' : newType;
		const subType = newType.startsWith('list_') ? newType.slice(5) : null;
		const existingProperty = propertiesStorage.getProperty(key);

		if (
			!isItemPropertyTypeValid(mainType) ||
			!existingProperty ||
			(subType && !isItemPropertyTypeValid(subType))
		) {
			return;
		}

		const convertedProperty = convertItemPropertyToNewType(existingProperty, mainType);

		if (!convertedProperty) {
			return;
		}

		if (
			convertedProperty &&
			isItemPropertyOfTypeList(convertedProperty) &&
			isItemPropertyTypeValid(subType)
		) {
			const subProperty = getDefaultItemPropertyForItemPropertyType(subType);

			if (!isItemPropertyOfTypeList(subProperty)) {
				convertedProperty.value.push(subProperty);
			}
		}

		propertiesStorage.setProperty(key, convertedProperty);
		refreshPropsStorageAndProcessTableEntries();
	};

	return (
		<div
			id={id}
			className={rootElementClassName}
			data-testid={testId}
			style={{
				opacity: isLoading ? 0.4 : undefined,
				pointerEvents: isLoading ? 'none' : undefined
			}}
		>
			{isEditMode && (
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
						<AddNewProperty onPropertyCreate={onPropertyCreate} />
					</TabPanel>
				</Tabs>
			)}
			<ItemPropertiesTable
				entries={entriesState.entries}
				areTopEntriesMissingProperties={tabsActiveIndexRef.current === 1}
				onPropertyRowMouseEnter={onPropertyRowMouseEnter}
				onPropertyRowMouseLeave={onPropertyRowMouseLeave}
				onPropertyChange={onPropertyChange}
				handlePropertyDelete={handlePropertyDelete}
				handlePropertyTypeChange={handlePropertyTypeChange}
				isEditMode={isEditMode}
				propertyKeyPrefix={propertyKeyPrefix.current}
			/>
		</div>
	);
};

const sortTableEntriesByNodesTitle = (entries: ItemPropertiesTableEntries) => {
	return entries.toSorted((a, b) => {
		const aTitle = idFormatter.parseIdToName(a[2].title);
		const bTitle = idFormatter.parseIdToName(b[2].title);

		return compareTwoStringsForSorting(aTitle, bTitle);
	});
};
