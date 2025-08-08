import './Tooltip.scss';
import { DBTooltip } from '@db-ux/react-core-components';
import { autoPlacement, autoUpdate, offset, useFloating } from '@floating-ui/react';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { TooltipProps } from './Tooltip.interfaces';

/**
 * This is a slightly improved version of the DBTooltip component. It allows
 * auto-positioning of the tooltip based on the available space.
 * NOTE: This is a temporary solution. Ideally we will use the DBTooltip component.
 */
export const Tooltip = (props: TooltipProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const { children, tooltipTargetRef, id, className, testId, ...rest } = props;
	const { refs, floatingStyles } = useFloating({
		placement: props.placement,
		strategy: 'fixed',
		middleware: [
			offset(props.offset || 0),
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
		],
		whileElementsMounted(referenceEl, floatingEl, update) {
			/**
			 * Performance improvement. We want tooltip to be properly positioned only on mouseOver, no need
			 * to observe
			 *
			 * @see https://floating-ui.com/docs/autoUpdate
			 */
			const cleanup = autoUpdate(referenceEl, floatingEl, update, {
				ancestorScroll: false,
				ancestorResize: false,
				layoutShift: false,
				animationFrame: false
			});
			return cleanup;
		}
	});
	const rootElementClassName = clsx('tooltip db-bg-color-lvl-1', className);

	useEffect(() => {
		if (props.isOpen) {
			setIsOpen(true);
		}
	}, []);

	useEffect(() => {
		const onMouseOver = () => {
			setIsOpen(true);
		};

		const onMouseOut = () => {
			setIsOpen(false);
		};

		if (tooltipTargetRef) {
			refs.setReference(tooltipTargetRef);

			if (props.isOpen === undefined) {
				tooltipTargetRef.addEventListener('mouseover', onMouseOver);
				tooltipTargetRef.addEventListener('mouseout', onMouseOut);
			}
		}

		return () => {
			if (tooltipTargetRef) {
				tooltipTargetRef.removeEventListener('mouseover', onMouseOver);
				tooltipTargetRef.removeEventListener('mouseout', onMouseOut);
			}
		};
	}, [tooltipTargetRef]);

	const style = {
		...floatingStyles,
		zIndex: 999,
		display: isOpen ? 'block' : 'none'
	};

	return (
		<div
			id={id}
			className={rootElementClassName}
			ref={refs.setFloating}
			style={style}
			data-testid={testId}
		>
			<DBTooltip {...rest} data-outside-vy={true} showArrow={false}>
				{children}
			</DBTooltip>
		</div>
	);
};
