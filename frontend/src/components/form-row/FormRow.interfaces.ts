import { ReactNode } from 'react';
import { GlobalComponentProps } from 'src/types/components';

export type FormRowProps = GlobalComponentProps & {
	children?: ReactNode;
};
