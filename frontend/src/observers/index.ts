import { initializeItemsStoreObservers } from 'src/observers/items';
import { initializeSearchStoreObservers } from 'src/observers/search';

export const allApplicationStoresObservers: Array<() => void> = [];

export const initializeApplicationStoresObservers = () => {
	initializeSearchStoreObservers();
	initializeItemsStoreObservers();
};

export const destroyApplicationStoresObservers = () => {
	allApplicationStoresObservers.forEach((observerUnsubscribe) => {
		observerUnsubscribe();
	});

	allApplicationStoresObservers.length = 0;
};
