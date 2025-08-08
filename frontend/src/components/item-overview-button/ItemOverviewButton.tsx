import './ItemOverviewButton.scss';
import { DBButton, DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useCallback, useRef, useState } from 'react';
import { ItemOverviewTooltip } from 'src/components/item-overview-tooltip/ItemOverviewTooltip';
import { Loading } from 'src/components/loading/Loading';
import { Node } from 'src/models/node';
import { useDrawerStore } from 'src/stores/drawer';
import { useItemsStore } from 'src/stores/items';
import { ITEM_OVERVIEW_TIMEOUT_MILLISECONDS } from 'src/utils/constants';
import { idFormatter } from 'src/utils/idFormatter';
import { ItemOverviewButtonProps } from './ItemOverviewButton.interfaces';

/**
 * This component is similar to ItemInfo component. We added it because it renders another level of information.
 */

export const ItemOverviewButton = ({ nodeId, id, className, testId }: ItemOverviewButtonProps) => {
	const [ref, setRef] = useState<HTMLButtonElement | null>(null);
	const [renderLoadingTooltip, setRenderLoadingTooltip] = useState(false);
	const [node, setNode] = useState<Node | undefined>(undefined);
	const setEntry = useDrawerStore((state) => state.setEntry);
	const getNodeAsync = useItemsStore((store) => store.getNodeAsync);
	const getStoreNode = useItemsStore((store) => store.getStoreNode);
	useItemsStore((store) => store.nodes);
	const timeoutRef = useRef(0);
	const rootElementClassName = clsx('item-overview-button', 'item-info', className);

	/**
	 * 	useCallback to prevent double calling of ref callback with null and the element
	 * 	@see https://legacy.reactjs.org/docs/refs-and-the-dom.html#caveats-with-callback-refs
	 */
	const onRefChange = useCallback((element: HTMLButtonElement | null) => {
		setRef(element);
	}, []);

	const onClick = () => {
		if (node) {
			setEntry({ itemId: node.id });
		}
	};

	const onMouseEnter = () => {
		window.clearTimeout(timeoutRef.current);

		const storeNode = getStoreNode(nodeId);

		if (!storeNode) {
			setRenderLoadingTooltip(true);

			timeoutRef.current = window.setTimeout(() => {
				getNodeAsync(nodeId).then((fetchedNode) => {
					setNode(fetchedNode);
					setRenderLoadingTooltip(false);
				});
			}, ITEM_OVERVIEW_TIMEOUT_MILLISECONDS);
		} else {
			setNode(storeNode);
		}
	};

	const onMouseLeave = () => {
		window.clearTimeout(timeoutRef.current);
		setRenderLoadingTooltip(false);
		setNode(undefined);
	};

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<DBButton
				className="item-overview__button"
				type="button"
				variant="ghost"
				size="small"
				onClick={onClick}
				ref={onRefChange}
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
			>
				{idFormatter.parseIdToName(nodeId)}
				{renderLoadingTooltip && (
					<DBTooltip>
						<Loading isLoading={true} />
					</DBTooltip>
				)}
				{node && <ItemOverviewTooltip item={node} tooltipRef={ref} />}
			</DBButton>
		</div>
	);
};
