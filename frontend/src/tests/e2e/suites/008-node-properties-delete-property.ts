import { expect } from '@playwright/test';
import { E2ETestFunctionProps } from '../E2E.interfaces';

export const _008_nodePropertiesDeleteProperty = async ({ page, i18n }: E2ETestFunctionProps) => {
	const sidebar = page.locator('.sidebar.items-drawer');

	// cache locators
	const accordionItem = sidebar
		.locator('li')
		.filter({
			has: page.locator('summary')
		})
		.filter({
			has: page.locator('p', { hasText: i18n.t('single_view_properties_title') })
		});

	const propertiesTable = accordionItem.locator('.item-properties-table');
	const propertyRows = propertiesTable.getByRole('row');

	// sanity check: three property rows left over from the previous test
	await expect(propertyRows).toHaveCount(3);

	const nameDummyRow = propertyRows.filter({ hasText: 'name__dummy_' });

	// in the "name__dummy_" row, click the three dots button, then "Delete property"
	await nameDummyRow.locator('button[data-icon="more_vertical"]').click();

	// the menu's options popover content is rendered via a portal, so look it up from
	// "page" instead of scoping it to the accordion item
	await page
		.getByRole('button', { name: i18n.t('item_properties_table_delete_property') })
		.click();

	// check there are now two property rows
	await expect(propertyRows).toHaveCount(2);

	// check there is a new tab called "Recommended"
	const recommendedTab = accordionItem.getByRole('tab', {
		name: i18n.t('tab_title_missing_properties')
	});

	await expect(recommendedTab).toBeVisible();

	// click the new "Recommended" tab
	await recommendedTab.click();

	// check if the first property row contains an element with the text "name__dummy_"
	await expect(propertyRows.first()).toContainText('name__dummy_');

	// save the changes (removed "name__dummy_", added "test") and verify it succeeds
	await accordionItem.getByRole('button', { name: i18n.t('edit_save_buttons_save') }).click();

	await expect(
		page.locator('.notifications__notification', {
			hasText: i18n.t('notifications_success_node_update')
		})
	).toBeInViewport();

	// check the properties section is still showing the two properties after saving
	await expect(propertyRows).toHaveCount(2);
};
