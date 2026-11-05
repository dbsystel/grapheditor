import { expect, Page } from '@playwright/test';
import { E2EBrowserTestFunctionProps } from '../E2E.interfaces';

const E2E_NEO4J_HOST = process.env.E2E_NEO4J_HOST;
const E2E_NEO4J_USER = process.env.E2E_NEO4J_USER;
const E2E_NEO4J_PASSWORD = process.env.E2E_NEO4J_PASSWORD;

/**
 * Covers the browser-tab scenarios described in "src/stores/tab.ts", by driving genuine browser
 * actions (new tab, duplicate tab, reload, back/forward navigation, logout) instead of triggering
 * any application logic manually. A dedicated page is opened and closed here, separate from the
 * page shared by the rest of the E2E suites.
 *
 * - "new-tab" is reproduced by opening a brand-new tab in the same browser window/context (the
 *   equivalent of ctrl+t). Per spec such a tab is a fresh top-level browsing context with no
 *   opener, so - even though it shares cookies with the rest of the window - it does NOT inherit
 *   sessionStorage, so the user has to log in again.
 * - "duplicate" is reproduced via the application's own "New tab" header button, which calls
 *   `window.open(location.href, '_blank')` without "noopener". Per the HTML Storage spec, opening
 *   such an "auxiliary browsing context" copies sessionStorage (the tab id/creation time) from the
 *   opener tab, while window.name starts out empty - exactly the condition useTabStore uses to
 *   detect a duplicated tab. The user therefore stays logged in automatically (a fresh tab id is
 *   issued server-side, reusing the opener's session), without re-entering credentials.
 *
 * 	 * Not every scenario listed in "src/stores/tab.ts" can be reproduced this way:
 * 	 - "replace" and "about:blank" are internal/defensive branches that currently aren't reachable
 * 	   through any real user action in the application
 * 	 - "reopen closed tab" (ctrl + shift + t) is not driven separately here: it produces the same
 * 	   signals as "duplicate" and is classified as such (see the isDuplicate branch in
 * 	   "src/stores/tab.ts" for why this is an accepted limitation).
 */
export const _000_loginAndTestTabScenarios = async ({
	browser,
	i18n
}: E2EBrowserTestFunctionProps) => {
	if (!E2E_NEO4J_HOST || !E2E_NEO4J_USER || !E2E_NEO4J_PASSWORD) {
		throw new Error('NEO4J_HOST, NEO4J_USER, and NEO4J_PASSWORD must be set in .env file');
	}

	const context = await browser.newContext();
	const page = await context.newPage();

	const homepageHeading = page.getByRole('heading', { name: i18n.t('homepage_title') });
	const loginForm = page.locator('.login-form');

	const login = async (targetPage: Page) => {
		await targetPage.getByRole('textbox', { name: /Host/ }).fill(E2E_NEO4J_HOST);
		await targetPage
			.getByRole('textbox', { name: i18n.t('form_login_username') })
			.fill(E2E_NEO4J_USER);
		await targetPage
			.getByRole('textbox', { name: i18n.t('form_login_password') })
			.fill(E2E_NEO4J_PASSWORD);
		await targetPage.getByRole('button', { name: 'Connect' }).click();

		await expect(
			targetPage.locator('.notifications__notification', {
				hasText: i18n.t('notifications_success_login')
			})
		).toBeVisible();
	};

	// --- log in on the first tab ---
	await page.goto('/');
	await login(page);
	await expect(homepageHeading).toBeVisible();

	// --- "new-tab" scenario: open a brand-new tab in the same browser window (ctrl+t) - a fresh
	// top-level browsing context with no opener, so it doesn't inherit sessionStorage/window.name,
	// and the user must log in again ---
	const newTab = await context.newPage();

	await newTab.goto('/');
	await expect(newTab.locator('.login-form')).toBeVisible();
	await expect(newTab.getByRole('heading', { name: i18n.t('homepage_title') })).toHaveCount(0);

	await newTab.close();

	// --- "duplicate" scenario: click the app's own "New tab" header button (window.open without
	// noopener) - sessionStorage is copied to the new tab while window.name starts empty, so the
	// user stays logged in automatically, without a login form ---
	const duplicateTabPromise = page.waitForEvent('popup');
	await page.getByRole('button', { name: i18n.t('header_new_tab_button') }).click();
	const duplicateTab = await duplicateTabPromise;

	await expect(duplicateTab.locator('.login-form')).toHaveCount(0);
	await expect(
		duplicateTab.getByRole('heading', { name: i18n.t('homepage_title') })
	).toBeVisible();
	await expect(
		duplicateTab.locator('.notifications__notification', {
			hasText: i18n.t('notifications_success_login')
		})
	).toBeVisible();

	await duplicateTab.close();

	// --- "reload" scenario: reload the same tab (ctrl+r) - the user stays logged in and lands
	// back on the homepage ---
	await page.reload();
	await expect(loginForm).toHaveCount(0);
	await expect(homepageHeading).toBeVisible();

	// --- "back-forward" scenario: navigate to a different URL in the same tab (typing a URL and
	// pressing enter), then use the browser's back/forward buttons - the user stays logged in
	// throughout, since window.name and the tab id persist for the same tab regardless of how it
	// navigates ---
	const homepageUrl = page.url();

	await page.goto(`${homepageUrl}?type=cypher-query`);
	await expect(loginForm).toHaveCount(0);

	await page.goBack();
	await expect(loginForm).toHaveCount(0);
	await expect(homepageHeading).toBeVisible();

	await page.goForward();
	await expect(loginForm).toHaveCount(0);

	await page.goBack();
	await expect(loginForm).toHaveCount(0);
	await expect(homepageHeading).toBeVisible();

	// --- log out and close the tab ---
	await page.locator('.header-settings button[data-icon="gear_wheel"]').click();
	await page.locator('.logout button[data-icon="log_out"]').click();

	await expect(
		page.locator('.notifications__notification', {
			hasText: i18n.t('notifications_success_logout')
		})
	).toBeVisible();
	await expect(loginForm).toBeVisible();

	await page.close();
	await context.close();
};
