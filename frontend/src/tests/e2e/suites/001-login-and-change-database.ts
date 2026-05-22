import { expect } from '@playwright/test';
import { E2ETestFunctionProps } from '../E2E.interfaces';

const E2E_NEO4J_HOST = process.env.E2E_NEO4J_HOST;
const E2E_NEO4J_USER = process.env.E2E_NEO4J_USER;
const E2E_NEO4J_PASSWORD = process.env.E2E_NEO4J_PASSWORD;
const E2E_NEO4J_DATABASE = process.env.E2E_NEO4J_DATABASE || '__please_provide_a_database__';

export const _001_loginAndChangeDatabase = async ({ page, i18n }: E2ETestFunctionProps) => {
	if (!E2E_NEO4J_HOST || !E2E_NEO4J_USER || !E2E_NEO4J_PASSWORD) {
		throw new Error('NEO4J_HOST, NEO4J_USER, and NEO4J_PASSWORD must be set in .env file');
	}

	// navigate to the root of the running dev server
	await page.goto('/');

	// login
	await page.getByRole('textbox', { name: /Host/ }).fill(E2E_NEO4J_HOST);
	await page.getByRole('textbox', { name: i18n.t('form_login_username') }).fill(E2E_NEO4J_USER);
	await page
		.getByRole('textbox', { name: i18n.t('form_login_password') })
		.fill(E2E_NEO4J_PASSWORD);
	await page.getByRole('button', { name: 'Connect' }).click();

	// wait for login success
	await expect(page.getByText(i18n.t('notifications_success_login'))).toBeVisible();

	// select "E2E_NEO4J_DATABASE" database for testing purposes
	const customSelect = page.locator('.database-menu__selector');
	await customSelect.waitFor({ state: 'visible', timeout: 15000 });
	await customSelect.click();

	// fill database's dropdown search field
	const searchPlaceholder = i18n.t('database_selector_search_placeholder');
	const searchBox = page
		.locator(`input[type='search'][placeholder='${searchPlaceholder}']:visible`)
		.first();

	await searchBox.waitFor({ state: 'visible', timeout: 15000 });
	await searchBox.fill(E2E_NEO4J_DATABASE);

	// click list item by text (label/li is usually visible)
	const dbListItem = page.locator(`li:has-text('${E2E_NEO4J_DATABASE}')`);
	await dbListItem.click();

	const notification = page.locator('.notifications__notification', {
		hasText: i18n.t('notifications_success_user_database_change')
	});
	await notification.waitFor({ state: 'visible', timeout: 15000 });
};
