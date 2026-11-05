import { test as base } from '@playwright/test';
import i18n, { I18nType } from 'src/i18n';

/**
 * i18n.ts already points at the real e2e backend when running in this Node-side process (see the "typeof window === 'undefined'"
 * branch there); just make sure the resource fetch has completed before tests start using i18n.t(...), so it reflects
 * the actual backend-provided overrides instead of a potentially-still-in-flight or bundled-only translation.
 */
const i18nReady = i18n.reloadResources(['de', 'en']);

export const extendedTest = base.extend<{
	i18n: I18nType;
}>({
	// {} is required by Playwright, it determines which fixtures a given fixture/test depends on by statically parsing
	// the source text of the first parameter)
	// eslint-disable-next-line no-empty-pattern
	i18n: async ({}, use) => {
		await i18nReady;
		await use(i18n);
	}
});
