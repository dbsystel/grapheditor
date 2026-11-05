import { expect } from '@playwright/test';
import { E2ETestFunctionProps } from '../E2E.interfaces';
import { clickStableNode } from '../helpers';

export const _007_nodePropertiesAddProperty = async ({ page, i18n }: E2ETestFunctionProps) => {
	// "search" for the node containing the text "Bob" (DOM text match, the closest equivalent
	// to an OS-level ctrl+F search that Playwright can reliably drive), then click it once its
	// position has stabilized
	await clickStableNode(page, { textFilter: 'Bob' });

	const sidebar = page.locator('.sidebar.items-drawer');

	await sidebar.waitFor({ state: 'visible' });

	// cache locators
	const accordionItem = sidebar
		.locator('li')
		.filter({
			has: page.locator('summary')
		})
		.filter({
			has: page.locator('p', { hasText: i18n.t('single_view_properties_title') })
		});

	// make sure the sidebar is actually showing Bob's details before proceeding - if the click
	// landed on the wrong node, failing fast here is more informative than a confusing
	// property-row mismatch later on
	await expect(sidebar.locator('.single-item__title-title', { hasText: 'Bob' })).toBeVisible();

	// enter properties edit mode
	await accordionItem.locator('summary').getByRole('button').click();

	const propertiesTable = accordionItem.locator('.item-properties-table');
	const propertyRows = propertiesTable.getByRole('row');

	// check there are two property rows, and that they contain the expected properties
	await expect(propertyRows).toHaveCount(2);
	await expect(propertyRows.nth(0)).toContainText('_uuid__tech_');
	await expect(propertyRows.nth(1)).toContainText('name__dummy_');

	// click the "new" button (tab) to open the new property tabpanel
	await accordionItem.getByRole('tab', { name: i18n.t('tab_title_new_property') }).click();

	// tabpanel containing an input field, a select element and a textarea should open
	const tabPanel = accordionItem.getByRole('tabpanel');

	await tabPanel.waitFor({ state: 'visible' });
	await expect(tabPanel.getByLabel(i18n.t('form_property_key'))).toBeVisible();
	await expect(tabPanel.locator('select')).toBeVisible();
	await expect(tabPanel.locator('textarea')).toBeVisible();

	// type "test" in the input field, then submit
	await tabPanel.getByLabel(i18n.t('form_property_key')).fill('test');
	await tabPanel.getByRole('button', { name: i18n.t('add_new_property_add') }).click();

	// check there are now three property rows
	await expect(propertyRows).toHaveCount(3);
};
