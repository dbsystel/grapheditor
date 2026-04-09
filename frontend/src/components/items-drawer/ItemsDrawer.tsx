import './ItemsDrawer.scss';
import clsx from 'clsx';
import { PropsWithChildren, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BreadcrumbEntry } from 'src/components/breadcrumb/Breadcrumb.interfaces';
import { Breadcrumbs } from 'src/components/breadcrumbs/Breadcrumbs';
import { ErrorBoundary } from 'src/components/error-boundary/ErrorBoundary';
import { ItemsDrawerProvider } from 'src/components/items-drawer/context/ItemsDrawerContext';
import { Sidebar } from 'src/components/sidebar/Sidebar';
import { SingleNode } from 'src/components/single-node/SingleNode';
import { SingleRelation } from 'src/components/single-relation/SingleRelation';
import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { DrawerStoreEntry, useDrawerStore } from 'src/stores/drawer';
import { eventBus, EventBusEvents } from 'src/utils/event-bus';
import { isNode } from 'src/utils/helpers/nodes';
import { isRelation } from 'src/utils/helpers/relations';
import { ItemsDrawerProps } from './ItemsDrawer.interfaces';

/**
 * Component to render stored items. Only the last item will be rendered.
 * A basic breadcrumbs component is added to enable visual track of added items.
 */
export const ItemsDrawer = ({ id, className, testId }: ItemsDrawerProps) => {
	const {
		entries,
		activeEntryIndex,
		getActiveEntry,
		setActiveEntryIndex,
		reset,
		removeEntryByItemId,
		updateEntriesByItems
	} = useDrawerStore((store) => store);
	// consider memo
	const activeDrawerEntry = getActiveEntry();
	let activeItem = null;
	const rootElementClassName = clsx('items-drawer', className);
	const contentElementClassName = clsx('items-drawer__content');

	useEffect(() => {
		const onItemsRemove = (
			data: EventBusEvents['nodesRemove'] | EventBusEvents['relationsRemove']
		) => {
			const items = 'nodes' in data ? data.nodes : data.relations;

			items.forEach((item) => {
				removeEntryByItemId(item.id);
			});
		};

		const onItemsUpdate = (
			data: EventBusEvents['nodesUpdate'] | EventBusEvents['relationsUpdate']
		) => {
			updateEntriesByItems('nodes' in data ? data.nodes : data.relations);
		};

		eventBus.subscribe('nodesUpdate', onItemsUpdate);
		eventBus.subscribe('relationsUpdate', onItemsUpdate);
		eventBus.subscribe('nodesRemove', onItemsRemove);
		eventBus.subscribe('relationsRemove', onItemsRemove);

		return () => {
			eventBus.unsubscribe('nodesUpdate', onItemsUpdate);
			eventBus.unsubscribe('relationsUpdate', onItemsUpdate);
			eventBus.unsubscribe('nodesRemove', onItemsRemove);
			eventBus.unsubscribe('relationsRemove', onItemsRemove);
		};
	}, []);

	const onClose = () => {
		if (activeDrawerEntry && activeDrawerEntry.onDrawerClose) {
			activeDrawerEntry.onDrawerClose(activeDrawerEntry);
		}

		reset();
	};

	if (activeDrawerEntry) {
		activeItem = activeDrawerEntry.item;
	}

	// prepare breadcrumbs
	const breadcrumbItems = entries.map<BreadcrumbEntry>((storeItem, index) => {
		return {
			item: storeItem.item,
			onClick: () => {
				setActiveEntryIndex(index);
			}
		};
	});

	return (
		activeDrawerEntry &&
		activeItem &&
		createPortal(
			<ItemsDrawerProvider isInsideItemsDrawer={true}>
				<Sidebar
					id={id}
					className={rootElementClassName}
					defaultIsCollapsed={false}
					data-testid={testId}
					direction="left"
					onCloseButtonClick={onClose}
					isHorizontalResizeable={true}
					sidebarId="item-details-sidebar"
					headerContent={
						<div className="items-drawer__header-content">
							<Breadcrumbs
								breadcrumbs={breadcrumbItems}
								activeBreadcrumbIndex={activeEntryIndex}
							/>
						</div>
					}
				>
					<div className={contentElementClassName}>
						<ErrorBoundary>
							<RenderComponent drawerEntry={activeDrawerEntry} item={activeItem} />
						</ErrorBoundary>
					</div>
				</Sidebar>
			</ItemsDrawerProvider>,
			document.getElementsByClassName('right-widget')[0]
		)
	);
};

const RenderComponent = ({
	drawerEntry,
	item
}: {
	drawerEntry: DrawerStoreEntry;
	item: Node | Relation;
}) => {
	if (isNode(item)) {
		return (
			<ComponentWrapper key={item.id} entry={drawerEntry}>
				<SingleNode node={item} shouldShowCenterButton={true} />
			</ComponentWrapper>
		);
	} else if (isRelation(item)) {
		return (
			<ComponentWrapper key={item.id} entry={drawerEntry}>
				<SingleRelation relation={item} shouldShowCenterButton={true} />
			</ComponentWrapper>
		);
	}
};

const ComponentWrapper = ({ children, entry }: PropsWithChildren<{ entry: DrawerStoreEntry }>) => {
	useEffect(() => {
		const entryOnMount = entry.onMount;

		if (entryOnMount) {
			entryOnMount(entry);
		}

		return () => {
			if (entryOnMount) {
				entryOnMount(entry);
			}
		};
	}, [entry]);

	return children;
};
