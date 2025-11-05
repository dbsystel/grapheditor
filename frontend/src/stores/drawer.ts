import { Item, ItemId, ItemTypeNode, ItemTypeRelation } from 'src/models/item';
import { NodeId } from 'src/models/node';
import { RelationId } from 'src/models/relation';
import { create } from 'zustand';

export type DrawerStoreEntry = {
	item: Item;
	//itemId: NodeId | RelationId;
	// properly address objects in case node and relation IDs have overlaps (it looks like this is
	// possible ¯\_(ツ)_/¯)
	itemType?: ItemTypeNode | ItemTypeRelation;
	onDrawerClose?: (drawerEntry: DrawerStoreEntry) => void;
	onMount?: (drawerEntry: DrawerStoreEntry) => void;
	onUnmount?: (drawerEntry: DrawerStoreEntry) => void;
};

type DrawerStore = {
	entries: Array<DrawerStoreEntry>;
	activeEntryIndex: number;
	updateEntriesByItems: (newItems: Array<Item>) => void;
	setEntry: (storeItem: DrawerStoreEntry) => void;
	addEntry: (storeItem: DrawerStoreEntry) => void;
	getActiveEntry: () => DrawerStoreEntry | undefined;
	setActiveEntryIndex: (index: number) => void;
	removeEntryByIndex: (index: number) => void;
	removeEntryByItemId: (itemId: NodeId | RelationId) => void;
	reset: () => void;
	resetButExclude: (excludeKeys: Array<keyof InitialState>) => void;
};

type InitialState = Omit<
	DrawerStore,
	| 'setEntry'
	| 'addEntry'
	| 'updateEntriesByItems'
	| 'getActiveEntry'
	| 'setActiveEntryIndex'
	| 'removeEntryByIndex'
	| 'removeEntryByItemId'
	| 'reset'
	| 'resetButExclude'
>;

const getInitialState: () => InitialState = () => {
	return {
		entries: [],
		activeEntryIndex: -1
	};
};

/**
 * Store for keeping track on clicked items. The items will be rendered in a
 * drawer component.
 */
export const useDrawerStore = create<DrawerStore>()((set, get) => {
	return {
		...getInitialState(),
		setEntry: (storeItem) => {
			set({
				entries: [storeItem],
				activeEntryIndex: 0
			});
		},
		addEntry: (storeItem) => {
			set({
				entries: [...get().entries, storeItem],
				activeEntryIndex: get().entries.length
			});
		},
		getActiveEntry: () => {
			return get().entries.at(get().activeEntryIndex);
		},
		setActiveEntryIndex: (index) => {
			const newItems = get().entries;
			newItems.length = index + 1;

			set({
				activeEntryIndex: index,
				entries: newItems
			});
		},
		removeEntryByIndex: (index) => {
			if (index > -1) {
				let activeEntryIndex = get().activeEntryIndex;
				get().entries.splice(index, 1);

				if (index <= activeEntryIndex) {
					activeEntryIndex -= 1;
				}

				set({
					entries: get().entries,
					activeEntryIndex: activeEntryIndex
				});
			}
		},
		removeEntryByItemId: (itemId) => {
			let entryIndex = -1;
			const entries = get().entries;

			for (let i = 0, l = entries.length; i < l; i++) {
				if (entries[i].item.id === itemId) {
					entryIndex = i;
					break;
				}
			}

			get().removeEntryByIndex(entryIndex);
		},
		updateEntriesByItems: (newItems) => {
			const newItemsRecord = newItems.reduce<Record<ItemId, Item>>(
				(accumulator, currentValue) => {
					accumulator[currentValue.id] = currentValue;

					return accumulator;
				},
				{}
			);
			const entries = get().entries;

			entries.forEach((entry) => {
				entry.item = newItemsRecord[entry.item.id] || entry.item;
			});

			set({
				entries: [...entries]
			});
		},
		reset: () => {
			set(getInitialState());
		},
		resetButExclude: (excludeKeys) => {
			const state: Partial<InitialState> = getInitialState();

			excludeKeys.forEach((key) => {
				delete state[key];
			});

			set(state);
		}
	};
});
