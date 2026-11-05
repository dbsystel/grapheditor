export type TabScenario =
	'new-tab' | 'reload' | 'back-forward' | 'duplicate' | 'replace' | 'about:blank';

export type TabScenarioResult = {
	scenario: TabScenario;
	tabId: string | null;
	navigationType: NavigationType | 'about:blank';
};
