import { expect } from '@playwright/test';
import { E2ETestFunctionProps } from '../E2E.interfaces';

export const _004_nodeAddlabelAndSave = async ({ page, i18n }: E2ETestFunctionProps) => {
	// execute seatch
	const startButton = page.getByRole('button', { name: 'Start' });

	await startButton.click();

	// wait until first graph node is visible and stable
	const fistNodeElement = await page.waitForFunction(
		() => {
			const firstNode = document.querySelector('.network-graph__node-label-container');
			if (!firstNode || !(firstNode instanceof HTMLElement) || firstNode.style.left === '') {
				return false;
			}

			const currentLeft = firstNode.style.left;
			const currentTop = firstNode.style.top;

			// store previous "left" and "top" value for comparison with current "left" and "top" values
			const previousLeft = firstNode.getAttribute('data-previous-left');
			const previousTop = firstNode.getAttribute('data-previous-top');

			firstNode.setAttribute('data-previous-left', currentLeft);
			firstNode.setAttribute('data-previous-top', currentTop);

			if (previousLeft === currentLeft && previousTop === currentTop) {
				firstNode.removeAttribute('data-previous-left');
				firstNode.removeAttribute('data-previous-top');

				return firstNode;
			} else {
				return null;
			}
		},
		null,
		{
			timeout: 30000,
			// graph seems to render twice in e2e, where nodes are differently positioned on each render
			polling: 300
		}
	);

	// get first visible graph node center coordinates
	const nodeCenter = await page.evaluate((element) => {
		if (!element || !(element instanceof HTMLElement)) {
			return null;
		}
		// left/top are set to (coordinates.x - size) and (coordinates.y - size),
		// we need to find the sigma canvas position and add the label's logical center
		const container =
			element.closest('.sigma-container') ?? element.parentElement?.parentElement;
		const containerRect = container?.getBoundingClientRect();
		const style = element.style;
		const left = parseFloat(style.left);
		const top = parseFloat(style.top);
		const size = parseFloat(style.width) / 2;
		// the visual center in the container's local space
		const localCenterX = left + size;
		const localCenterY = top + size;

		return {
			x: (containerRect?.left ?? 0) + localCenterX,
			y: (containerRect?.top ?? 0) + localCenterY
		};
	}, fistNodeElement);

	if (!nodeCenter) {
		throw new Error('Could not compute node center');
	}

	// open ItemsDrawer and wait until it is visible
	await page.mouse.click(nodeCenter.x, nodeCenter.y);

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
	await firstUncheckedOption.waitFor({ state: 'visible', timeout: 15000 });
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
