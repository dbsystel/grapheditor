import { expect } from '@playwright/test';
import { E2ETestFunctionProps } from '../E2E.interfaces';

export const _010_nodeRelationsDeleteRelation = async ({ page, i18n }: E2ETestFunctionProps) => {
	const sidebar = page.locator('.sidebar.items-drawer');

	// cache locators
	const accordionItem = sidebar
		.locator('li')
		.filter({
			has: page.locator('summary')
		})
		.filter({
			has: page.locator('p', { hasText: i18n.t('connections_title') })
		});

	const relationsTable = accordionItem.locator('.connections__overview');
	const relationRows = relationsTable.getByRole('row');

	// sanity check: two relation rows left over from the previous test
	await expect(relationRows).toHaveCount(2);

	// which of the two relations gets removed doesn't matter, so just use the first row
	const relationRowToDelete = relationRows.first();

	// click the three dots button, then "Delete relation"
	await relationRowToDelete.locator('button[data-icon="more_vertical"]').click();

	await page.getByRole('button', { name: i18n.t('connections_delete_relation_button') }).click();

	// confirm the "delete relation" confirmation modal
	await page.getByRole('button', { name: i18n.t('confirm_delete_relation_button') }).click();

	// confirm the success notification
	await expect(
		page.locator('.notifications__notification', {
			hasText: i18n.t('notifications_success_relation_delete')
		})
	).toBeInViewport();

	// there should be 1 relation row left again
	await expect(relationRows).toHaveCount(1);
};
