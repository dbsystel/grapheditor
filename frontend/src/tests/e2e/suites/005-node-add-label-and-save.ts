import { expect } from '@playwright/test';
import { E2ETestFunctionProps } from '../E2E.interfaces';
import { clickStableNode } from '../helpers';

export const _005_nodeAddlabelAndSave = async ({ page, i18n }: E2ETestFunctionProps) => {
	// execute seatch
	const startButton = page.getByRole('button', { name: 'Start' });

	await startButton.click();

	// wait until the first graph node is visible and stable, then click it to open ItemsDrawer
	await clickStableNode(page);

	const sidebar = page.locator('.sidebar.items-drawer');

	await sidebar.waitFor({ state: 'visible' });

	// cache locators
	const accordionItem = sidebar
		.locator('li')
		.filter({
			has: page.locator('summary')
		})
		.filter({
			has: page.locator('p', { hasText: i18n.t('single_node_labels_title') })
		});
	const dropdownTagsContainer = accordionItem.locator('.node-labels-item-finder__labels');
	const dropdownContainer = accordionItem.locator('.node-labels-item-finder__itemfinder');

	// enter label's edit mode
	await accordionItem.locator('summary').getByRole('button').click();

	// click on dropdown's input
	await dropdownContainer.getByRole('textbox').click();

	// cache locators
	const list = dropdownContainer.getByRole('list');
	const checkedOptions = list.locator('.item-finder__list-item--checked');
	const uncheckedOptions = list.locator(
		'.item-finder__list-item:not(.item-finder__list-item--checked)'
	);
	const firstUncheckedOption = uncheckedOptions.nth(0);

	// cache number of selected options and active tags
	const numberOfTags = await dropdownTagsContainer.locator('> *').count();
	const numberOfCheckedOptions = await checkedOptions.count();

	// select additional label (possible issue if we need to scroll to the option)
	await firstUncheckedOption.waitFor({ state: 'visible' });
	await firstUncheckedOption.locator('strong').click();

	// check if number of selected options and active tags is incresed by 1
	await expect(list.locator('.item-finder__list-item--checked')).toHaveCount(
		numberOfCheckedOptions + 1
	);
	await expect(dropdownTagsContainer.locator('> *')).toHaveCount(numberOfTags + 1);

	await accordionItem.getByRole('button', { name: i18n.t('edit_save_buttons_save') }).click();

	await expect(
		page.locator('.notifications__notification', {
			hasText: i18n.t('notifications_success_node_update')
		})
	).toBeInViewport();

	// check again if number of active tags is still increased by 1 (the component refreshes)
	await expect(dropdownTagsContainer.locator('> *')).toHaveCount(numberOfTags + 1);
};
