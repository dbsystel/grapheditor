import { allApplicationStoresObservers } from 'src/observers/index';
import { useItemsStore } from 'src/stores/items';
import { useParallaxStore } from 'src/stores/parallax';
import { parallaxApi } from 'src/utils/api/parallax';

export const initializeItemsStoreObservers = () => {
	const unsubscribeItemsStoreNodesObserver = useItemsStore.subscribe(
		(store) => store.nodes,
		() => {
			conditionallyTriggerParallax();
		}
	);

	const unsubscribeItemsStoreRelationsObserver = useItemsStore.subscribe(
		(store) => store.relations,
		() => {
			conditionallyTriggerParallax();
		}
	);

	allApplicationStoresObservers.push(
		unsubscribeItemsStoreNodesObserver,
		unsubscribeItemsStoreRelationsObserver
	);

	return {
		nodesUnsubscribe: unsubscribeItemsStoreNodesObserver,
		relationsUnsubscribe: unsubscribeItemsStoreRelationsObserver
	};
};

/**
 * Important for parallax: we need to observe nodes coming from a search (cypher-query, full-text,
 * perspectives, para-queries) and general node changes via the GUI and start the parallax from the
 * beginning. There are many places in the project where node changes can occur, therefore they will
 * be observed here.
 * Only one parallax request can be triggered at the time. This means, updating nodes and relations
 * at the same time in the items store should trigger only one parallax API call.
 */
const conditionallyTriggerParallax = () => {
	const apiTriggerType = useParallaxStore.getState().apiTriggerType;

	if (apiTriggerType === 'initial' || apiTriggerType === 'refresh') {
		parallaxApi.triggerStart();
	}
};
