import { HTMLAttributes, PropsWithChildren } from 'react';
import { GlobalComponentProps } from 'src/types/components';

export type TableRowProps = PropsWithChildren<GlobalComponentProps> &
	HTMLAttributes<HTMLDivElement> & {
		variant?: 'hoverable';
	};
