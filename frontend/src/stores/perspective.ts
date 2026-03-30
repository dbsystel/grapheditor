import { Perspective } from 'src/models/perspective';
import { create } from 'zustand';

type PerspectivesStore = {
	isLoading: boolean;
	perspective: Perspective | null;
	setIsLoading: (isLoading: boolean) => void;
	setPerspective: (perspective: Perspective) => void;
	reset: () => void;
};

type InitialState = Omit<PerspectivesStore, 'setPerspective' | 'setIsLoading' | 'reset'>;

const getInitialState: () => InitialState = () => {
	return {
		perspective: null,
		isLoading: false
	};
};

/**
 * Perspectives store.
 */
export const usePerspectiveStore = create<PerspectivesStore>((set) => ({
	...getInitialState(),
	setPerspective: (perspective) => {
		set({ perspective: perspective });
	},
	setIsLoading: (isLoading) => {
		set({ isLoading: isLoading });
	},
	reset: () => {
		set(getInitialState());
	}
}));

(window as any).usePerspectiveStore = usePerspectiveStore;
