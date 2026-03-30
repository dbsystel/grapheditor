import './ItemInfo.scss';
import { DBButton } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { MouseEvent, useCallback, useState } from 'react';
import { useItemsDrawerContext } from 'src/components/items-drawer/context/ItemsDrawerContext';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useDrawerStore } from 'src/stores/drawer';
import { useItemOverviewPopoverStore } from 'src/stores/item-overview-popover';
import { isNode } from 'src/utils/helpers/nodes';
import { idFormatter } from 'src/utils/id-formatter';
import { ItemInfoProps } from './ItemInfo.interfaces';

/**
 * This component contains a link to an item that can be a relation or a node.
 * It also contains a tooltip that renders the longDescription of the item.
 * This was done without any design, so keep in mind the code here could be/is temporary
 * until a proper design for this component is done. Therefore, some elements/functions
 * are very similar and repeated.
 */

export const ItemInfo = ({
	item,
	id,
	className,
	testId,
	showTooltipOnHover = true
}: ItemInfoProps) => {
	const [ref, setRef] = useState<HTMLButtonElement | null>(null);
	const { isInsideItemsDrawer } = useItemsDrawerContext();
	const rootElementClassName = clsx('item-info', className);

	/**
	 * 	useCallback to prevent double calling of ref callback with null and the element
	 * 	@see https://legacy.reactjs.org/docs/refs-and-the-dom.html#caveats-with-callback-refs
	 */
	const onRefChange = useCallback((element: HTMLButtonElement | null) => {
		setRef(element);

		if (element) {
			useItemOverviewPopoverStore
				.getState()
				.registerTriggerElement({ triggerElement: element, item: item });
		}
	}, []);

	const onClick = () => {
		const overviewEntries = useItemOverviewPopoverStore
			.getState()
			.overviews.map((overview) => ({ item: overview.item }));

		useItemOverviewPopoverStore.getState().reset();

		if (isInsideItemsDrawer) {
			useDrawerStore.getState().addEntry({ item: item });
		} else {
			const existingDrawerEntries = useDrawerStore.getState().entries;
			const entries = [...existingDrawerEntries, ...overviewEntries];

			if (overviewEntries.at(overviewEntries.length - 1)?.item.id !== item.id) {
				entries.push({ item: item });
			}

			useDrawerStore.getState().setEntries(entries);
		}
	};

	const onContextMenu = (event: MouseEvent) => {
		if (ref && isNode(item)) {
			if (showTooltipOnHover) {
				useItemOverviewPopoverStore.getState().reset();
			}

			event.preventDefault();
			useContextMenuStore.getState().open({
				type: 'node',
				event: event,
				nodeIds: [item.id],
				x: event.clientX,
				y: event.clientY
			});
		}
	};

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<DBButton
				type="button"
				className="item-info__button"
				aria-describedby={item.id}
				variant="ghost"
				size="small"
				onClick={onClick}
				ref={onRefChange}
				onContextMenu={onContextMenu}
			>
				{idFormatter.parseIdToName(item.title)}
			</DBButton>
		</div>
	);
};
