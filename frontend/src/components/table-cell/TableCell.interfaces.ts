import { PropsWithChildren } from 'react';
import { GlobalComponentProps } from 'src/types/components';

export type TableCellProps = PropsWithChildren<GlobalComponentProps> & {
	width?: 'auto' | 'full' | 'minimal';
	asGridCell?: boolean;
};
