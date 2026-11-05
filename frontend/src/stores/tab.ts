import { TabScenario, TabScenarioResult } from 'src/models/tab';
import { getTabCreatedAt, getTabId, setTabCreatedAt } from 'src/utils/tab-id';
import { create } from 'zustand';

type TabStore = {
	tabData: TabScenarioResult;
	initialize: () => void;
	reset: () => void;
};

type InitialState = Omit<TabStore, 'initialize' | 'reset'>;

const getInitialState = (): InitialState => {
	return {
		tabData: {
			scenario: 'about:blank',
			navigationType: 'about:blank',
			tabId: null
		}
	};
};

/**
 * General browser tab store.
 */
export const useTabStore = create<TabStore>((set) => ({
	...getInitialState(),
	initialize: () => {
		const activation = window.navigation.activation;
		let scenario: TabScenario;
		let tabId: string | null = null;
		let navigationType: NavigationType | 'about:blank' = 'about:blank';
		const hasWindowName = !!window.name;
		const isDuplicate = !!getTabCreatedAt() && !hasWindowName;

		setTabCreatedAt(new Date().getTime());
		window.name = 'IGA';

		// blank page
		if (!activation) {
			scenario = 'about:blank';
			tabId = null;

			return { scenario, tabId, navigationType };
		}

		const hasFrom = activation.from !== null;

		navigationType = activation.navigationType;

		/**
		 * Browser tab scenarios to consider:
		 * - new tab (e.g. ctrl + t)
		 * - tab reload (e.g. ctrl + r)
		 * - tab reload with different path (e.g. visit "http://localhost:8080/?type=cypher-query", then change the URL
		 *   to "http://localhost:8080/" and press enter)
		 * - right click on tab -> click "Duplicate tab"
		 * - click on the "New tab" button in the application's header
		 * - traversing browser's history using browser's forward/backward buttons
		 * - browser history "push"/"replace"
		 * - reopen closed tab (ctrl + shift + t)
		 * - middle-click / ctrl + click a link
		 * - tab discarding / lazy tab restore (to test visit "edge://settings/system/managePerformance" -> set tab inactive
		 *   after 30s)
		 * - speculation rules https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API (not used at the moment)
		 */

		// the order of statements IS important
		if (navigationType === 'push' && hasFrom && hasWindowName) {
			// same tab, different URL path
			scenario = 'reload';
			tabId = getTabId();
		} else if (navigationType === 'push' && !hasFrom) {
			// new tab (e.g. ctrl + t)
			scenario = 'new-tab';
			tabId = null;
		} else if (navigationType === 'reload' && hasFrom) {
			// same tab, explicitly reloaded (e.g. ctrl + r)
			scenario = 'reload';
			tabId = getTabId();
		} else if (navigationType === 'replace' && hasWindowName) {
			// history "push"/"replace" with a prior document: ordinary same-tab navigation
			scenario = 'replace';
			tabId = getTabId();
		} else if (isDuplicate) {
			// tab duplicated (right click -> "Duplicate tab", or the app's "New tab" button)
			//
			// NOTE: "reopen closed tab" (ctrl + shift + t) also lands here. It's indistinguishable
			// from a real duplicate: both restore sessionStorage while window.name is empty, and
			// both report navigationType "traverse" with the same NavigationHistoryEntry key as
			// the original tab - the browser uses the same session-restore mechanism for both.
			// Accepted limitation: the user stays logged in, just treated as a fresh tab derived
			// from the original session instead of resuming the exact same tab id. Don't move this
			// branch after "traverse" below to "fix" it - that would only misclassify genuine
			// duplicates instead.
			scenario = 'duplicate';
			tabId = getTabId();
		} else if (navigationType === 'traverse') {
			// - genuine back/forward navigation in the same tab
			scenario = 'back-forward';
			tabId = getTabId();
		} else {
			scenario = 'new-tab';
			tabId = null;
		}

		set({ tabData: { scenario: scenario, tabId: tabId, navigationType: navigationType } });
	},
	reset: () => {
		set(getInitialState());
	}
}));

(window as any).useTabStore = useTabStore;
