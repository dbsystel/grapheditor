import './ItemOverviewPopover.scss';
import { DBPopover } from '@db-ux/react-core-components';
import { autoPlacement, autoUpdate, computePosition, offset, shift } from '@floating-ui/react';
import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SingleNode } from 'src/components/single-node/SingleNode';
import { SingleRelation } from 'src/components/single-relation/SingleRelation';
import { isNode } from 'src/utils/helpers/nodes';
import { isRelation } from 'src/utils/helpers/relations';
import { ItemOverviewPopoverProps } from './ItemOverviewPopover.interfaces';

/**
 * This component renders the content of each item.
 * It gives the user an overview of details to the corresponding item.
 */
export const ItemOverviewPopover = ({
	item,
	popoverRef,
	popoverOffset,
	id,
	className,
	testId
}: ItemOverviewPopoverProps) => {
	// TODO make a "floating component" (reuse this logic, instead of copy/paste it around the project)
	// TODO we are testing if @floating-ui's non-framework API solves the "ResizeObserver loop completed
	//  with undelivered notifications" error. Test start date: 12.11.2025. Test time minimum: 1 month.
	//  After that decide to either use the react's way of @floating-ui (useFloating) or manual as
	//  seen in one of the useEffects below. Please leave the commented code below as a reference to
	//  how it was before.
	// const { refs, floatingStyles, update } = useFloating({
	// 	placement: 'top',
	// 	strategy: 'fixed',
	// 	middleware: [
	// 		offset(tooltipOffset || 0),
	// 		autoPlacement({
	// 			allowedPlacements: [
	// 				'top',
	// 				'top-end',
	// 				'top-start',
	// 				'right',
	// 				'right-end',
	// 				'right-start',
	// 				'bottom',
	// 				'bottom-end',
	// 				'bottom-start',
	// 				'left',
	// 				'left-end',
	// 				'left-start'
	// 			]
	// 		})
	// 	],
	// 	whileElementsMounted(referenceEl, floatingEl, update) {
	// 		/**
	// 		 * Performance improvement. We want popover to be properly positioned only on mouseOver, no need
	// 		 * to observe other changes.
	// 		 *
	// 		 * @see https://floating-ui.com/docs/autoUpdate
	// 		 */
	// 		const cleanup = autoUpdate(referenceEl, floatingEl, update, {
	// 			ancestorScroll: false,
	// 			ancestorResize: false,
	// 			layoutShift: false,
	// 			animationFrame: false
	// 		});
	//
	// 		return cleanup;
	// 	}
	// });
	const rootElementClassName = clsx('item-overview-popover', className);
	const localPopoverRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const popoverElement = localPopoverRef.current;

		if (popoverElement && popoverRef) {
			autoUpdate(
				popoverRef,
				popoverElement,
				() => {
					computePosition(popoverRef, popoverElement, {
						strategy: 'fixed',
						placement: 'top',
						middleware: [
							offset(popoverOffset || 0),
							shift({ crossAxis: true }),
							autoPlacement({
								allowedPlacements: [
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
							})
						]
					}).then((computedPosition) => {
						// adjust for bottom placements manually since fixed positioning with bottom won't render
						// content over our mouse pointer, which would close the popover immediately
						if (['top', 'top-start', 'top-end'].includes(computedPosition.placement)) {
							const documentHeight = window.document.documentElement.clientHeight;
							const distanceFromBottom = documentHeight - computedPosition.y;
							const yPosition = distanceFromBottom - popoverElement.offsetHeight;

							popoverElement.style.top = '';
							popoverElement.style.bottom = yPosition + 'px';
							popoverElement.style.left = computedPosition.x + 'px';
						} else {
							popoverElement.style.bottom = '';
							popoverElement.style.top = computedPosition.y + 'px';
							popoverElement.style.left = computedPosition.x + 'px';
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
	}, []);

	return createPortal(
		<dialog id={id} open={true} className={rootElementClassName} data-testid={testId}>
			<DBPopover className="item-overview-popover__popover" open={true} ref={localPopoverRef}>
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
