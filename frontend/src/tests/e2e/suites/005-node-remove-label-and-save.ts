import { expect } from '@playwright/test';
import { E2ETestFunctionProps } from '../E2E.interfaces';

export const _005_nodeRemoveLabelAndSave = async ({ page, i18n }: E2ETestFunctionProps) => {
	const itemsDrawerSidebar = page.locator('.sidebar.items-drawer');

	await itemsDrawerSidebar.waitFor({ state: 'visible' });

	// cache locators
	const accordionItem = itemsDrawerSidebar
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
	const firstCheckedOption = checkedOptions.nth(0);

	// cache number of selected options and active tags
	const numberOfTags = await dropdownTagsContainer.locator('> *').count();
	const numberOfCheckedOptions = await checkedOptions.count();

	// select additional label
	await firstCheckedOption.waitFor({ state: 'visible', timeout: 15000 });
	await firstCheckedOption.locator('strong').click();

	// check if number of selected options and active tags is incresed by 1
	await expect(list.locator('.item-finder__list-item--checked')).toHaveCount(
		numberOfCheckedOptions - 1
	);
	await expect(dropdownTagsContainer.locator('> *')).toHaveCount(numberOfTags - 1);

	await accordionItem.getByRole('button', { name: i18n.t('edit_save_buttons_save') }).click();

	await expect(
		page.locator('.notifications__notification', {
			hasText: i18n.t('notifications_success_node_update')
		})
	).toBeInViewport();

	// check again if number of active tags is still decreased by 1 (the component refreshes)
	await expect(dropdownTagsContainer.locator('> *')).toHaveCount(numberOfTags - 1);
};
