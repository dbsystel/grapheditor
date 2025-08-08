import { CSSProperties, PropsWithChildren } from 'react';
import { GlobalComponentProps } from 'src/types/components';

export type TableProps = GlobalComponentProps &
	PropsWithChildren & {
		width?: 'auto' | 'full';
		asGrid?: boolean;
		style?: CSSProperties;
	};
