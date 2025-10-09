import './ItemInfo.scss';
import { DBButton } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { MouseEvent, useCallback, useRef, useState } from 'react';
import { ItemOverviewTooltip } from 'src/components/item-overview-tooltip/ItemOverviewTooltip';
import { useItemsDrawerContext } from 'src/components/items-drawer/context/ItemsDrawerContext';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useDrawerStore } from 'src/stores/drawer';
import { ITEM_OVERVIEW_TIMEOUT_MILLISECONDS } from 'src/utils/constants';
import { isNode } from 'src/utils/helpers/nodes';
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
	const [renderTooltip, setRenderTooltip] = useState(false);
	const { setEntry, addEntry } = useDrawerStore((store) => store);
	const timeoutRef = useRef(0);
	const { isInsideItemsDrawer } = useItemsDrawerContext();
	const rootElementClassName = clsx('item-info', className);

	/**
	 * 	useCallback to prevent double calling of ref callback with null and the element
	 * 	@see https://legacy.reactjs.org/docs/refs-and-the-dom.html#caveats-with-callback-refs
	 */
	const onRefChange = useCallback((element: HTMLButtonElement | null) => {
		setRef(element);
	}, []);

	const onClick = () => {
		if (isInsideItemsDrawer) {
			addEntry({ itemId: item.id });
		} else {
			setEntry({ itemId: item.id });
		}
	};

	const onMouseEnter = () => {
		if (showTooltipOnHover) {
			timeoutRef.current = window.setTimeout(() => {
				setRenderTooltip(true);
			}, ITEM_OVERVIEW_TIMEOUT_MILLISECONDS);
		}
	};

	const resetTooltip = () => {
		window.clearTimeout(timeoutRef.current);

		setRenderTooltip(false);
	};

	const onMouseLeave = () => {
		if (showTooltipOnHover) {
			resetTooltip();
		}
	};

	const onContextMenu = (event: MouseEvent) => {
		if (ref && isNode(item)) {
			if (showTooltipOnHover) {
				resetTooltip();
			}

			event.preventDefault();
			useContextMenuStore.getState().open({
				type: 'node',
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
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
				onContextMenu={onContextMenu}
			>
				{item.title}

				{renderTooltip && <ItemOverviewTooltip item={item} tooltipRef={ref} />}
			</DBButton>
		</div>
	);
};
