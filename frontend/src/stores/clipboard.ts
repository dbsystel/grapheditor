import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { create } from 'zustand';

type ClipboardStore = {
	clipboard: {
		nodes: Array<Node>;
		relations: Array<Relation>;
	};
	writeToClipboard: (nodes: Array<Node>, relations: Array<Relation>) => void;
	reset: () => void;
};

type InitialState = Omit<ClipboardStore, 'writeToClipboard' | 'reset'>;

const getInitialState: () => InitialState = () => {
	return {
		clipboard: {
			nodes: [],
			relations: []
		}
	};
};

/**
 * A simple clipboard store.
 * It should provide better control of what did the user copy and make dealing
 * with paste much more predictable since we know the structure of our clipboard store.
 * Also, it allows user to use its default clipboard browser functionality and
 * our in parallel.
 */
export const useClipboardStore = create<ClipboardStore>()((set) => {
	return {
		...getInitialState(),
		writeToClipboard: (nodes, relations) => {
			set({
				clipboard: {
					nodes: nodes,
					relations: relations
				}
			});
		},
		reset: () => {
			set(getInitialState());
		}
	};
});

(window as any).useClipboardStore = useClipboardStore;
