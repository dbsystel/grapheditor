import { PropsWithChildren } from 'react';
import { GlobalComponentProps } from 'src/types/components';

export type ModalProps = GlobalComponentProps &
	PropsWithChildren & {
		isOpen: boolean;
		backdrop?: string;
	};
