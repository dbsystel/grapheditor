import clsx from 'clsx';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	processItemPropertiesEntries,
	showNotificationForPropertyTypeAndValueMismatch,
	validateItemProperties
} from 'src/components/item-properties/helpers';
import { ItemPropertiesTable } from 'src/components/item-properties/table/ItemPropertiesTable';
import { ItemPropertiesTableEntries } from 'src/components/item-properties/table/ItemPropertiesTable.interfaces';
import { ItemPropertiesAddNewProperty } from 'src/components/item-properties/tabs/add-new-property/ItemPropertiesAddNewProperty';
import { TabItem } from 'src/components/tab-item/TabItem';
import { TabList } from 'src/components/tab-list/TabList';
import { TabPanel } from 'src/components/tab-panel/TabPanel';
import { Tabs } from 'src/components/tabs/Tabs';
import { ItemPropertyKey, ItemPropertyWithKey } from 'src/models/item';
import { nodesApi } from 'src/utils/api/nodes';
import { relationsApi } from 'src/utils/api/relations';
import { clone, objectHasOwnProperty } from 'src/utils/helpers/general';
import { isNode } from 'src/utils/helpers/nodes';
import { isRelation } from 'src/utils/helpers/relations';
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
		complete: ItemPropertiesTableEntries;
		top: ItemPropertiesTableEntries;
		renderIncompleteTab: boolean;
	}>({
		complete: [],
		top: [],
		renderIncompleteTab: false
	});
	const [renderKey, setRenderKey] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const tabsActiveIndexRef = useRef(-1); // -1 = none
	const topEntriesPropertyKeysCacheRef = useRef<Array<ItemPropertyKey>>([]);
	const propsStorageRef = useRef({
		metaData: metaData,
		filterMetaByNodeIds: filterMetaByNodeIds,
		itemProperties: clone(item.properties)
	});
	const propertiesRef = useRef(clone(item.properties));
	const rootElementClassName = clsx('item-properties', className);

	useImperativeHandle(handleRef, () => ({
		handleSave,
		handleUndo,
		properties: propertiesRef.current
	}));

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
			itemProperties: propertiesRef.current
		};

		const processTableEntries = async () => {
			const { metaData, filterMetaByNodeIds, itemProperties } = propsStorageRef.current;
			const propertyNodes = await nodesApi.postNodesBulkFetch({
				nodeIds: Object.keys(itemProperties)
			});

			const { newCompleteEntries, newIncompleteEntries, newTopEntries } =
				processItemPropertiesEntries({
					propertyNodes: propertyNodes,
					metaData: metaData,
					filterMetaByNodeIds: filterMetaByNodeIds,
					itemProperties: itemProperties,
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

	// sort as sort into complete/incomplete columns, not sort alphabetically or similar
	const sortTopEntriesMap = (keepActiveTabIndex?: boolean) => {
		if (!keepActiveTabIndex) {
			tabsActiveIndexRef.current = -1;
		}

		topEntriesPropertyKeysCacheRef.current = [];
		refreshComponent();
	};

	const onTabChange = (tabElement: HTMLInputElement, tabIndex: number) => {
		tabsActiveIndexRef.current = tabIndex;
		sortTopEntriesMap(true);
	};

	const handleSave = async () => {
		if (!isLoading) {
			const itemPropertiesAreValid = validateItemProperties(propertiesRef.current);

			if (!itemPropertiesAreValid) {
				showNotificationForPropertyTypeAndValueMismatch();
				return;
			}

			setIsLoading(true);

			const patchObject = {
				id: item.id,
				properties: propertiesRef.current
			};

			if (isNode(item)) {
				await nodesApi.patchNodesAndUpdateApplication([patchObject]);
			} else if (isRelation(item)) {
				await relationsApi.patchRelationsAndUpdateApplication([patchObject]);
			}

			topEntriesPropertyKeysCacheRef.current = [];
			setIsLoading(false);
		}
	};

	const handleUndo = () => {
		propertiesRef.current = clone(item.properties);
		topEntriesPropertyKeysCacheRef.current = [];
		refreshComponent();
	};

	const onPropertyCreate = (property: ItemPropertyWithKey) => {
		propertiesRef.current[property.key] = {
			value: property.value,
			type: property.type,
			edit: true
		};

		topEntriesPropertyKeysCacheRef.current.push(property.key);
		refreshComponent();
	};

	const onPropertyChange = (key: ItemPropertyKey, value: string) => {
		// if we work with missing ("recommended") properties
		if (!objectHasOwnProperty(propertiesRef.current, key)) {
			propertiesRef.current[key] = {
				type: 'string',
				value: '',
				edit: true
			};
		}

		propertiesRef.current[key].value = value;
	};

	const onPropertyDelete = (key: ItemPropertyKey) => {
		delete propertiesRef.current[key];
		refreshComponent();
	};

	const refreshComponent = () => {
		setRenderKey(window.crypto.randomUUID());
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
						<ItemPropertiesAddNewProperty onPropertyCreate={onPropertyCreate} />
					</TabPanel>
				</Tabs>
			)}

			<ItemPropertiesTable
				topEntries={entriesState.top}
				entries={entriesState.complete}
				areTopEntriesMissingProperties={tabsActiveIndexRef.current === 1}
				onPropertyRowMouseEnter={onPropertyRowMouseEnter}
				onPropertyRowMouseLeave={onPropertyRowMouseLeave}
				onPropertyChange={onPropertyChange}
				onPropertyDelete={onPropertyDelete}
				isEditMode={isEditMode}
			/>
		</div>
	);
};
