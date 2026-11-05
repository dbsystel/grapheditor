import { expect } from '@playwright/test';
import { E2ETestFunctionProps } from '../E2E.interfaces';

export const _004_paraQueriesDropdown = async ({ page, i18n }: E2ETestFunctionProps) => {
	const leftSidebar = page.locator('.left-widget').getByRole('complementary');
	const leftSidebarCollapseButton = leftSidebar.locator('button[data-icon="chevron_left"]');

	// close the left sidebar in case a previous test in the flow left it open, so it doesn't
	// interfere with (or take up space from) this test - it's collapsed by default, so only
	// click the collapse button if it's currently expanded
	if (await leftSidebarCollapseButton.isVisible()) {
		await leftSidebarCollapseButton.click();
	}

	const paraQueriesLabel = 'ParaQueries';
	const paraQueriesPlaceholder = i18n.t('para_queries_dropdown_placeholder');

	// scoped to the header, since the left sidebar's "Presentation" options also render a
	// ".toggle-group" (and stay in the DOM even while the sidebar is collapsed), which would
	// otherwise cause these locators to match more than one element
	const headerToggleGroup = page.locator('.header .toggle-group');
	const toggleButtons = headerToggleGroup.locator('button');
	const selectedTypeLabel = headerToggleGroup.locator('strong');

	const paraQueriesContainer = page.locator('.para-queries');
	const dropdown = paraQueriesContainer.locator('.db-custom-select');
	const summary = dropdown.locator('summary');
	// placeholder is served as :before, and the element has aria-hidden="true"
	const dropdownPlaceholder = dropdown.locator(
		`.db-custom-select-placeholder[data-placeholder="${paraQueriesPlaceholder}"]`
	);
	const options = dropdown.getByRole('listitem');

	// click the 4th button of the header's toggle group, which switches global search to ParaQueries
	await toggleButtons.nth(3).click();
	await expect(selectedTypeLabel).toHaveText(paraQueriesLabel);

	// the ParaQueries dropdown control itself is now visible
	await expect(summary).toBeVisible();
	await expect(dropdownPlaceholder).toBeVisible();

	// opening the dropdown triggers a backend request that (re-)loads the available para-queries
	await summary.click();

	await expect(options).toHaveCount(3);
	await expect(options.nth(0)).toHaveText('Return all nodes of a certain type');
	await expect(options.nth(1)).toHaveText(
		'Return all nodes that have a specific property and a certain value on a property.'
	);
	await expect(options.nth(2)).toHaveText(
		'Return all persons in the database. This paraquery has no parameters.'
	);

	// select the second para-query - it has 3 parameters: "label" and "propertyName" provide
	// suggestions and are rendered as combo boxes, "propertyValue" has none and is rendered as
	// a plain input
	await options.nth(1).click();

	const paraQueryEditor = paraQueriesContainer.locator('.para-query-editor');
	const comboBoxes = paraQueryEditor.locator(':scope > .combo-box');
	const plainInputs = paraQueryEditor.locator(':scope > .db-input');
	// any parameter element (combo box or plain input) attaching to the DOM signals that the
	// backend response for this para-query (including its parameter suggestions) has arrived
	// and the editor finished rendering its parameters - wait for that before counting them
	const anyParameterElement = comboBoxes.or(plainInputs).first();

	await expect(paraQueryEditor).toBeVisible();
	await expect(anyParameterElement).toBeVisible();
	await expect(comboBoxes).toHaveCount(2);
	await expect(plainInputs).toHaveCount(1);

	// switch back to the default cypher-query search type so later tests aren't affected
	await toggleButtons.nth(0).click();
};
