import 'src/components/context-menu/sub-menu/top-block/ContextMenuTopBlock.scss';
import { DBButton } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ContextMenuTopBlockProps } from './ContextMenuTopBlock.interfaces';

export const ContextMenuTopBlock = ({
	closeSubMenuFunction,
	children,
	id,
	className,
	testId
}: ContextMenuTopBlockProps) => {
	const rootElementClassName = clsx('context-menu__sub-menu-top-block', className);

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<DBButton
				type="button"
				onClick={closeSubMenuFunction}
				icon="arrow_left"
				variant="ghost"
			/>
			{children}
		</div>
	);
};
