import { expect } from '@playwright/test';
import { E2ETestFunctionProps } from '../E2E.interfaces';

export const _009_nodeRelationsAddRelation = async ({ page, i18n }: E2ETestFunctionProps) => {
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

	// check there is only 1 relation row
	await expect(relationRows).toHaveCount(1);

	// click on the "add relation" button
	await accordionItem.getByRole('tab', { name: i18n.t('add_relation') }).click();

	const tabPanel = accordionItem.getByRole('tabpanel');

	await tabPanel.waitFor({ state: 'visible' });

	// click on the "choose relation type" input
	const relationTypeInput = tabPanel.getByLabel(i18n.t('create_relation_connection'));

	await relationTypeInput.click();

	// check if "owns__dummy_" option is available
	// (unlike the target node field below, the relation type suggestions include other valid
	// options too - e.g. "likes__dummy_" since Bob already has such a relation - so "owns__dummy_"
	// isn't guaranteed to be the first one)
	const relationTypeOptions = tabPanel.locator('.item-finder__list .item-finder__list-item');

	await expect(relationTypeOptions.filter({ hasText: 'owns__dummy_' })).toBeVisible();

	// click on the "owns__dummy_" option
	await relationTypeOptions.filter({ hasText: 'owns__dummy_' }).first().click();

	// click on the "end node" input
	const targetNodeInput = tabPanel.getByLabel(i18n.t('create_relation_target_node'));

	await targetNodeInput.click();

	// check if a "Car__dummy_ <number>" option is available, and is the first option
	// (the car node has no distinguishing name property, so its title is auto-generated as
	// "Car__dummy_ <number>" and the numeric suffix is not stable across runs)
	const targetNodeOptions = tabPanel.locator('.item-finder__list .item-finder__list-item');
	const carOptionTextPattern = /Car__dummy_\s*\d+/;

	await expect(targetNodeOptions.first()).toContainText(carOptionTextPattern);

	// click on the "Car__dummy_<number>" option
	await targetNodeOptions.filter({ hasText: carOptionTextPattern }).first().click();

	// click on the submit button
	await tabPanel.getByRole('button', { name: i18n.t('form_add_button') }).click();

	// confirm the success notification
	await expect(
		page.locator('.notifications__notification', {
			hasText: i18n.t('notifications_success_relation_create')
		})
	).toBeInViewport();

	// there should be 2 relation rows now
	await expect(relationRows).toHaveCount(2);
};
