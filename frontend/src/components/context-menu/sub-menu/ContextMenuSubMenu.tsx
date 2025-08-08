import './ContextMenuSubMenu.scss';
import clsx from 'clsx';
import { ContextMenuSubMenuProps } from './ContextMenuSubMenu.interfaces';

export const ContextMenuSubMenu = ({
	children,
	id,
	className,
	testId
}: ContextMenuSubMenuProps) => {
	const rootElementClassName = clsx('context-menu__sub-menu', className);

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{children}
		</div>
	);
};
