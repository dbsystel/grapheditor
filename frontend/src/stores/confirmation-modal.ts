import { ReactNode } from 'react';
import { create } from 'zustand';

export type ConfirmationModalContent = {
	title: string;
	description: ReactNode;
	onConfirmClick: () => void;
	onCancelClick: () => void;
	confirmLabel?: string;
	cancelLabel?: string;
};

type ConfirmationModalStore = {
	content: ConfirmationModalContent | null;
	open: (content: ConfirmationModalContent) => void;
	close: () => void;
};

type InitialState = Omit<ConfirmationModalStore, 'open' | 'close'>;

const getInitialState: () => InitialState = () => ({
	content: null
});

export const useConfirmationModalStore = create<ConfirmationModalStore>()((set) => ({
	...getInitialState(),
	open: (content: ConfirmationModalContent) => {
		set({ content: content });
	},
	close: () => {
		set({ content: null });
	}
}));

(window as any).useConfirmationModalStore = useConfirmationModalStore;
