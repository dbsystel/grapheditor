import { ParallaxInitialQuery, ParallaxSteps } from 'src/models/parallax';
import { useItemsStore } from 'src/stores/items';
import { useParallaxStore } from 'src/stores/parallax';
import { useSearchStore } from 'src/stores/search';
import { GLOBAL_SEARCH_TYPE_VALUE_PARALLAX } from 'src/utils/constants';
import { postParallax } from 'src/utils/fetch/postParallax';
import { isHomepageView } from 'src/utils/helpers/general';
import { buildSimpleSearchResult } from 'src/utils/helpers/search';

export const parallaxApi = {
	postParallax: postParallax,
	triggerStart: () => {
		wrapParallaxTrigger(triggerStart);
	},
	triggerNextSteps: (nextSteps: ParallaxSteps) => {
		wrapParallaxTrigger(triggerNextSteps.bind(null, nextSteps));
	},
	triggerFilters: (initialQuery: ParallaxInitialQuery, steps: ParallaxSteps) => {
		wrapParallaxTrigger(triggerFilters.bind(null, initialQuery, steps));
	},
	triggerBreadcrumbs: (index: number) => {
		wrapParallaxTrigger(triggerBreadcrumbs.bind(null, index));
	}
};

async function triggerStart() {
	await parallaxApi
		.postParallax({
			nodeIds: useItemsStore.getState().nodes.keys().toArray(),
			filters: { labels: [], properties: {} },
			steps: []
		})
		.then((response) => {
			useParallaxStore.getState().reset();
			useParallaxStore.getState().setInitialQuery({
				filters: { labels: [], properties: {} },
				nodeIds: Object.keys(response.data.nodes)
			});
			useParallaxStore.getState().setParallaxData(response.data);
		});
}

async function triggerNextSteps(steps: ParallaxSteps) {
	useParallaxStore.getState().setShouldPreventApiCall(true);

	await parallaxApi
		.postParallax({
			nodeIds: useParallaxStore.getState().initialQuery.nodeIds,
			filters: useParallaxStore.getState().initialQuery.filters,
			steps: steps
		})
		.then((response) => {
			enableParallaxApiCallsOnSearchResultProcessEnd();

			useSearchStore.getState().setResult({
				data: buildSimpleSearchResult(Object.values(response.data.nodes)),
				type: GLOBAL_SEARCH_TYPE_VALUE_PARALLAX
			});

			useParallaxStore.getState().setParallaxData(response.data);
			useParallaxStore.getState().setHistory(steps);
			useParallaxStore.getState().setCurrentHistoryIndex(steps.length - 1);
		});
}

async function triggerFilters(initialQuery: ParallaxInitialQuery, steps: ParallaxSteps) {
	useParallaxStore.getState().setShouldPreventApiCall(true);

	await parallaxApi
		.postParallax({
			nodeIds: initialQuery.nodeIds,
			filters: initialQuery.filters,
			steps: steps
		})
		.then((response) => {
			enableParallaxApiCallsOnSearchResultProcessEnd();

			useSearchStore.getState().setResult({
				data: buildSimpleSearchResult(Object.values(response.data.nodes)),
				type: GLOBAL_SEARCH_TYPE_VALUE_PARALLAX
			});

			useParallaxStore.getState().setParallaxData(response.data);
			useParallaxStore.getState().setInitialQuery(initialQuery);
			useParallaxStore.getState().setHistory(steps);
		});
}

async function triggerBreadcrumbs(index: number) {
	useParallaxStore.getState().setShouldPreventApiCall(true);

	await parallaxApi
		.postParallax({
			nodeIds: useParallaxStore.getState().initialQuery.nodeIds,
			filters: useParallaxStore.getState().initialQuery.filters,
			steps: useParallaxStore.getState().history.slice(0, index + 1)
		})
		.then((response) => {
			enableParallaxApiCallsOnSearchResultProcessEnd();

			useSearchStore.getState().setResult({
				data: buildSimpleSearchResult(Object.values(response.data.nodes)),
				type: GLOBAL_SEARCH_TYPE_VALUE_PARALLAX
			});

			useParallaxStore.getState().setParallaxData(response.data);
			useParallaxStore.getState().setCurrentHistoryIndex(index);
		});
}

async function wrapParallaxTrigger(callback: () => Promise<void>) {
	if (
		useParallaxStore.getState().isLoading ||
		useParallaxStore.getState().apiTriggerType === 'none' ||
		useParallaxStore.getState().shouldPreventApiCall ||
		isHomepageView()
	) {
		return;
	}

	useParallaxStore.getState().setIsLoading(true);

	await callback();

	useParallaxStore.getState().setIsLoading(false);
	useParallaxStore.getState().setApiTriggerType('refresh');
}

const enableParallaxApiCallsOnSearchResultProcessEnd = () => {
	const unsubscribe = useSearchStore.subscribe(
		(store) => store.isResultProcessed,
		(isResultProcessed) => {
			if (isResultProcessed) {
				unsubscribe();
				useParallaxStore.getState().setShouldPreventApiCall(false);
			}
		}
	);
};
