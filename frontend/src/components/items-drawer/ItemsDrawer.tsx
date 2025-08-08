import './ItemsDrawer.scss';
import { DBButton, DBDrawer, DBSection } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { PropsWithChildren, useEffect } from 'react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Breadcrumbs } from 'src/components/breadcrumbs/Breadcrumbs';
import { Breadcrumb } from 'src/components/breadcrumbs/Breadcrumbs.interfaces';
import { ErrorBoundary } from 'src/components/error-boundary/ErrorBoundary';
import { ItemsDrawerProvider } from 'src/components/items-drawer/context/ItemsDrawerContext';
import { SingleNode } from 'src/components/single-node/SingleNode';
import { SingleRelation } from 'src/components/single-relation/SingleRelation';
import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { DrawerStoreEntry, useDrawerStore } from 'src/stores/drawer';
import { useItemsStore } from 'src/stores/items';
import { isNode } from 'src/utils/helpers/nodes';
import { isRelation } from 'src/utils/helpers/relations';
import { DrawerHeadProps, ItemsDrawerProps } from './ItemsDrawer.interfaces';

/**
 * Component to render stored items. Only the last item will be rendered.
 * A basic breadcrumbs component is added to enable visual track of added items.
 */
export const ItemsDrawer = ({ id, className, testId }: ItemsDrawerProps) => {
	const { entries, activeEntryIndex, getActiveEntry, setActiveEntryIndex, reset } =
		useDrawerStore((store) => store);
	const getStoreItem = useItemsStore((store) => store.getStoreItem);
	const getStoreNode = useItemsStore((store) => store.getStoreNode);
	const getStoreRelation = useItemsStore((store) => store.getStoreRelation);
	useItemsStore((store) => store.nodes);
	useItemsStore((store) => store.relations);
	const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
	// consider memo
	const activeDrawerEntry = getActiveEntry();
	let activeItem = null;
	const rootElementClassName = clsx('items-drawer', className, {
		'items-drawer--collapsed': isCollapsed
	});

	const onClose = () => {
		reset();

		if (activeDrawerEntry && activeDrawerEntry.onDrawerClose) {
			activeDrawerEntry.onDrawerClose(activeDrawerEntry);
		}
	};

	const toggleDrawerSize = () => {
		setIsCollapsed((prev) => !prev);
	};

	if (activeDrawerEntry) {
		if (activeDrawerEntry.itemType === 'node') {
			activeItem = getStoreNode(activeDrawerEntry.itemId);
		} else if (activeDrawerEntry.itemType === 'relation') {
			activeItem = getStoreRelation(activeDrawerEntry.itemId);
		} else {
			activeItem = getStoreItem(activeDrawerEntry.itemId);
		}
	}

	// prepare breadcrumbs
	const breadcrumbItems: Array<Breadcrumb> = entries.map((storeItem, index) => {
		let storeItemItem: Node | Relation | undefined;

		switch (storeItem.itemType) {
			case 'node':
				storeItemItem = getStoreNode(storeItem.itemId);
				break;
			case 'relation':
				storeItemItem = getStoreRelation(storeItem.itemId);
				break;
			default:
				storeItemItem = getStoreItem(storeItem.itemId);
		}

		return {
			text: storeItemItem?.title || '',
			title: storeItemItem?.id,
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
				<DBDrawer
					closeButtonText=""
					id={id}
					className={rootElementClassName}
					data-testid={testId}
					backdrop="none"
					open={true}
					onClose={onClose}
					drawerHeader={
						<DrawerHead
							breadcrumbs={breadcrumbItems}
							activeBreadcrumbIndex={activeEntryIndex}
							onClose={onClose}
							isCollapsed={isCollapsed}
							toggleDrawerSize={toggleDrawerSize}
						/>
					}
					spacing="none"
				>
					<div className={clsx('items-drawer__content', { hidden: isCollapsed })}>
						<ErrorBoundary>
							<RenderComponent drawerEntry={activeDrawerEntry} item={activeItem} />
						</ErrorBoundary>
					</div>
				</DBDrawer>
			</ItemsDrawerProvider>,
			document.body
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
				<SingleNode node={item} />
			</ComponentWrapper>
		);
	} else if (isRelation(item)) {
		return (
			<ComponentWrapper key={item.id} entry={drawerEntry}>
				<SingleRelation relation={item} />
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

const DrawerHead = ({
	breadcrumbs,
	isCollapsed,
	toggleDrawerSize,
	activeBreadcrumbIndex
}: DrawerHeadProps & {
	isCollapsed: boolean;
	toggleDrawerSize: () => void;
	activeBreadcrumbIndex: number;
}) => {
	return (
		<DBSection spacing="none" className="items-drawer__header">
			<DBButton
				icon={isCollapsed ? 'chevron_left' : 'chevron_right'}
				onClick={toggleDrawerSize}
				variant="ghost"
				noText
			/>
			<div className={clsx('items-drawer__content', { hidden: isCollapsed })}>
				<Breadcrumbs
					breadcrumbs={breadcrumbs}
					activeBreadcrumbIndex={activeBreadcrumbIndex}
				/>
			</div>
		</DBSection>
	);
};
