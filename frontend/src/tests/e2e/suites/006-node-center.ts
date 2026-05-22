import { expect } from '@playwright/test';
import { E2ETestFunctionProps } from '../E2E.interfaces';

export const _006_nodeCenter = async ({ page, i18n }: E2ETestFunctionProps) => {
	await page.waitForTimeout(1000);

	const itemsDrawerSidebar = page.getByRole('complementary').filter({
		has: page.locator('button[data-icon="start"]')
	});

	await page.locator('button[data-icon="start"]').click();

	await page.waitForTimeout(1000);

	const firstNode = page.locator('.network-graph__node-label-container').first();

	await expect(firstNode).toBeInViewport();

	const firstNodeContainer = page.locator('.network-graph__node-labels-container');
	const parentBoundingBox = await firstNodeContainer.boundingBox();

	if (!parentBoundingBox) {
		throw new Error('Parent bounding box not available');
	}

	const centerX = parentBoundingBox.x + parentBoundingBox.width / 2;
	const centerY = parentBoundingBox.y + parentBoundingBox.height / 2;

	await page.mouse.click(centerX, centerY);

	await itemsDrawerSidebar.waitFor({ state: 'visible' });

	// close sidebar
	await itemsDrawerSidebar.locator('.sidebar__header-close-button').click();
};
