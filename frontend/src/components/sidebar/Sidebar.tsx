import './Sidebar.scss';
import { DBButton } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useState } from 'react';
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
	id,
	className,
	testId
}: SidebarProps) => {
	const [isCollapsed, setIsCollapsed] = useState(defaultIsCollapsed);
	const rootElementClassName = clsx(
		'sidebar',
		{
			'sidebar--collapsed': isCollapsed
		},
		className
	);

	const toggleDrawer = () => {
		const newCollapsed = !isCollapsed;

		setIsCollapsed(newCollapsed);

		if (!newCollapsed && onExpand) {
			onExpand();
		} else if (newCollapsed && onCollapse) {
			onCollapse();
		}
	};

	const icon = isCollapsed ? 'chevron_right' : 'chevron_left';

	return (
		<div
			className={rootElementClassName}
			id={id}
			data-testid={testId}
			data-direction={direction}
		>
			<header className="sidebar__header">
				{!shouldHideCloseButton && (
					<DBButton
						className="sidebar__header-close-button"
						icon="cross"
						variant="ghost"
						noText
						onClick={onCloseButtonClick}
					/>
				)}
				<div className="sidebar__header-content">{headerContent}</div>
				<DBButton
					className="sidebar__header-collapse-button"
					icon={icon}
					onClick={toggleDrawer}
					variant="ghost"
					noText
				/>
			</header>
			<div className="sidebar__content">{children}</div>
		</div>
	);
};
