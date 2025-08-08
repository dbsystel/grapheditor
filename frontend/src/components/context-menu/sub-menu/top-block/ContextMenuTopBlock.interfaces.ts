import { PropsWithChildren } from 'react';
import { GlobalComponentProps } from 'src/types/components';

export type ContextMenuTopBlockProps = PropsWithChildren &
	GlobalComponentProps & {
		closeSubMenuFunction: () => void;
	};
