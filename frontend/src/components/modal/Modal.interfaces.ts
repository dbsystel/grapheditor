import { CSSProperties, PropsWithChildren } from 'react';
import { GlobalComponentProps } from 'src/types/components';

export type ModalProps = GlobalComponentProps &
	PropsWithChildren & {
		isOpen: boolean;
		shouldUseBackdrop?: boolean;
		shouldDisplayAsModal?: boolean;
		style?: CSSProperties;
		headline?: string;
		description?: string;
		onClose?: () => void;
	};
