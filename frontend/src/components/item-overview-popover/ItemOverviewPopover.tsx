import './ItemOverviewPopover.scss';
import { DBPopover } from '@db-ux/react-core-components';
import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/react';
import clsx from 'clsx';
import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SingleNode } from 'src/components/single-node/SingleNode';
import { SingleRelation } from 'src/components/single-relation/SingleRelation';
import { useItemOverviewPopoverStore } from 'src/stores/item-overview-popover';
import { isNode } from 'src/utils/helpers/nodes';
import { isRelation } from 'src/utils/helpers/relations';
import { ItemOverviewPopoverProps } from './ItemOverviewPopover.interfaces';

/**
 * This component renders the content of an item in a popover.
 * It gives the user an overview of details to the corresponding item.
 */
export const ItemOverviewPopover = ({
	item,
	popoverRef,
	popoverOffset,
	popoverPlacement,
	id,
	className,
	testId
}: ItemOverviewPopoverProps) => {
	const rootElementClassName = clsx('item-overview-popover', className);
	const localPopoverRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const popoverElement = localPopoverRef.current;
		let cleanup = () => {};

		if (popoverElement && popoverRef) {
			cleanup = autoUpdate(
				popoverRef,
				popoverElement,
				() => {
					computePosition(popoverRef, popoverElement, {
						strategy: 'fixed',
						placement: popoverPlacement || 'top',
						middleware: [
							offset(popoverOffset || 0),
							// use the "flip" function instead of the "autoPlacement" function,
							// the "autoPlacement" function completely ignores the "placement" option
							flip({
								fallbackStrategy: 'initialPlacement',
								fallbackPlacements: [
									'top',
									'top-end',
									'top-start',
									'right',
									'right-end',
									'right-start',
									'bottom',
									'bottom-end',
									'bottom-start',
									'left',
									'left-end',
									'left-start'
								]
							}),
							shift({ crossAxis: true })
						]
					}).then((computedPosition) => {
						// adjust for bottom placements manually since fixed positioning with bottom won't render
						// content over our mouse pointer, which would close the popover immediately
						if (['top', 'top-start', 'top-end'].includes(computedPosition.placement)) {
							const documentHeight = window.document.documentElement.clientHeight;
							const distanceFromBottom = documentHeight - computedPosition.y;
							const yPosition = distanceFromBottom - popoverElement.offsetHeight;

							window.requestAnimationFrame(() => {
								popoverElement.style.top = '';
								popoverElement.style.bottom = yPosition + 'px';
								popoverElement.style.left = computedPosition.x + 'px';
							});
						} else {
							window.requestAnimationFrame(() => {
								popoverElement.style.bottom = '';
								popoverElement.style.top = computedPosition.y + 'px';
								popoverElement.style.left = computedPosition.x + 'px';
							});
						}
					});
				},
				{
					ancestorScroll: false,
					ancestorResize: false,
					layoutShift: false,
					animationFrame: false
				}
			);
		}

		return () => {
			cleanup();
		};
	}, []);

	const onRefChange = useCallback((element: HTMLDivElement | null) => {
		localPopoverRef.current = element;

		if (element) {
			useItemOverviewPopoverStore.getState().registerPopoverElementAndEvents(element);
		}
	}, []);

	return createPortal(
		<dialog id={id} open={true} className={rootElementClassName} data-testid={testId}>
			<DBPopover className="item-overview-popover__popover" open={true} ref={onRefChange}>
				{isNode(item) && (
					<SingleNode
						node={item}
						variant="small"
						isEditable={false}
						shouldShowOpenButton={true}
					/>
				)}
				{isRelation(item) && (
					<SingleRelation
						relation={item}
						variant="small"
						isEditable={false}
						shouldShowOpenButton={true}
					/>
				)}
			</DBPopover>
		</dialog>,
		document.body
	);
};
