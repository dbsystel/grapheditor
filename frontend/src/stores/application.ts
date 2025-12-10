import { create } from 'zustand';

type ApplicationStore = {
	isHomepageView: boolean;
	setIsHomepageView: (isHomepageView: boolean) => void;
	reset: () => void;
};

type InitialState = Omit<ApplicationStore, 'setIsHomepageView' | 'reset'>;

const getInitialState: () => InitialState = () => {
	return {
		isHomepageView: true
	};
};

/**
 * General application store.
 */
export const useApplicationStore = create<ApplicationStore>((set) => ({
	...getInitialState(),
	setIsHomepageView: (isHomepageView) => {
		set({ isHomepageView: isHomepageView });
	},
	reset: () => {
		set(getInitialState());
	}
}));
