import { expect } from '@playwright/test';
import { E2ETestFunctionProps } from '../E2E.interfaces';

export const _007_switchBetweenPresentationOptions = async ({
	page,
	i18n
}: E2ETestFunctionProps) => {
	const leftSidebar = page.locator('.left-widget').getByRole('complementary');

	// open left sidebar
	await leftSidebar.locator('button[data-icon="chevron_right"]').click();

	await leftSidebar.locator('[data-icon="list"]').click();
	await expect(page.getByTestId('global-search-results-object-table')).toBeVisible();

	await leftSidebar.locator('[data-icon="grid"]').click();
	await expect(page.getByTestId('global-search-results-table')).toBeVisible();

	await leftSidebar.locator('[data-icon="share"]').click();
	await expect(page.locator('.network-graph')).toBeVisible();
};
