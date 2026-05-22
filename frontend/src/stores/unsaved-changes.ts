import { UnsavedChangesHandle } from 'src/types/components';
import { create } from 'zustand';

type UnsavedChangesStore = {
	handles: Array<UnsavedChangesHandle>;
	addHandle: (handle: UnsavedChangesHandle) => void;
	getHandlesWithUnsavedChanges: () => Array<UnsavedChangesHandle>;
	reset: () => void;
};

type InitialState = Omit<
	UnsavedChangesStore,
	'addHandle' | 'getHandlesWithUnsavedChanges' | 'reset'
>;

const getInitialState: () => InitialState = () => {
	return {
		handles: []
	};
};

/**
 * Unsaved item changes store.
 */
export const useUnsavedChangesStore = create<UnsavedChangesStore>((set, get) => ({
	...getInitialState(),
	addHandle: (handle) => {
		const handlesClone = [...get().handles];

		handlesClone.push(handle);

		set({
			handles: handlesClone
		});
	},
	getHandlesWithUnsavedChanges: () => {
		const handlesWithUnsavedChanges: Array<UnsavedChangesHandle> = [];

		get().handles.forEach((handle) => {
			if (handle.checkIfHasUnsavedChanges()) {
				handlesWithUnsavedChanges.push(handle);
			}
		});

		return handlesWithUnsavedChanges;
	},
	reset: () => {
		set(getInitialState());
	}
}));

(window as any).useUnsavedChangesStore = useUnsavedChangesStore;
