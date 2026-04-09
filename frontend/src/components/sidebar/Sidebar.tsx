import './Sidebar.scss';
import { DBButton } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { MouseEvent as ReactMouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useSettingsStore } from 'src/stores/settings';
import { SidebarProps } from './Sidebar.interfaces';

/**
 * Simple sidebar component. Meant to be visible, either expanded or collapsed.
 * If you need to completely remove/not render this component, please use parent component to
 * control that.
 */
export const Sidebar = ({
	headerContent,
	shouldHideCloseButton = false,
	defaultIsCollapsed = true,
	direction = 'right',
	onCollapse,
	onExpand,
	onCloseButtonClick,
	children,
	isHorizontalResizeable,
	sidebarId,
	id,
	className,
	testId
}: SidebarProps) => {
	const [isCollapsed, setIsCollapsed] = useState(defaultIsCollapsed);
	const rootElementRef = useRef<HTMLDivElement>(null);
	const resizeInitialData = useRef({
		inlineSize: 0,
		x: 0,
		y: 0,
		cursor: '',
		directionMultiplier: 1
	});
	const rootElementClassName = clsx(
		'sidebar',
		{
			'sidebar--collapsed': isCollapsed
		},
		className
	);

	useEffect(() => {
		if (rootElementRef.current && sidebarId) {
			const sidebarWidth = useSettingsStore.getState().getSidebarWidth(sidebarId);

			if (sidebarWidth) {
				rootElementRef.current.style.width = sidebarWidth;
			}
		}
	}, []);

	const toggleSidebar = () => {
		const newCollapsed = !isCollapsed;

		setIsCollapsed(newCollapsed);

		if (!newCollapsed && onExpand) {
			onExpand();
		} else if (newCollapsed && onCollapse) {
			onCollapse();
		}
	};

	const onMouseDown = useCallback(
		(event: ReactMouseEvent<HTMLSpanElement>) => {
			// prevent text selection
			event.preventDefault();

			resizeInitialData.current.x = event.nativeEvent.clientX;
			resizeInitialData.current.y = event.nativeEvent.clientY;
			resizeInitialData.current.inlineSize = rootElementRef.current?.offsetWidth || 0;
			resizeInitialData.current.cursor = window.document.body.style.cursor;
			resizeInitialData.current.directionMultiplier = direction === 'right' ? 1 : -1;

			window.document.addEventListener('mousemove', onMouseMove);
			window.document.addEventListener('mouseup', onMouseUp);

			window.document.body.style.cursor = 'col-resize';
		},
		[direction]
	);

	const onMouseMove = useCallback(
		(event: MouseEvent) => {
			if (rootElementRef.current) {
				// prevent text selection
				event.preventDefault();

				const clientXDifference =
					(event.clientX - resizeInitialData.current.x) *
					resizeInitialData.current.directionMultiplier;

				rootElementRef.current.style.inlineSize =
					resizeInitialData.current.inlineSize + clientXDifference + 'px';
			}
		},
		[direction]
	);

	const onMouseUp = useCallback(() => {
		window.document.removeEventListener('mousemove', onMouseMove);
		window.document.removeEventListener('mouseup', onMouseUp);

		const sidebarWidth = rootElementRef.current?.offsetWidth;

		if (sidebarId && sidebarWidth !== undefined) {
			useSettingsStore.getState().setSidebarWidth(sidebarId, sidebarWidth + 'px');
		}

		window.document.body.style.cursor = resizeInitialData.current.cursor;
	}, [direction]);

	const icon = isCollapsed ? 'chevron_right' : 'chevron_left';

	return (
		<div
			className={rootElementClassName}
			id={id}
			data-testid={testId}
			data-direction={direction}
			ref={rootElementRef}
		>
			{isHorizontalResizeable && (
				<span className="sidebar__horizontal-resize" onMouseDown={onMouseDown} />
			)}
			<header className="sidebar__header">
				{!shouldHideCloseButton && (
					<DBButton
						className="sidebar__header-close-button"
						icon="cross"
						variant="ghost"
						noText
						onClick={onCloseButtonClick}
						type="button"
					/>
				)}

				<div className="sidebar__header-content">{headerContent}</div>
				<DBButton
					className="sidebar__header-collapse-button"
					icon={icon}
					onClick={toggleSidebar}
					variant="ghost"
					noText
					type="button"
				/>
			</header>
			<div className="sidebar__content">{children}</div>
		</div>
	);
};
