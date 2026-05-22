import { expect } from '@playwright/test';
import { E2ETestFunctionProps } from '../E2E.interfaces';

export const _003_searchTypeControlsVisibleComponents = async ({
	page,
	i18n
}: E2ETestFunctionProps) => {
	const cypherLabel = i18n.t('global_search_cypher_query');
	const fullTextLabel = i18n.t('global_search_full_text');
	const perspectiveLabel = i18n.t('global_search_perspective');
	const paraQueriesLabel = 'ParaQueries';
	const perspectivePlaceholder = i18n.t('perspective_finder_placeholder');
	const paraQueriesPlaceholder = i18n.t('para_queries_dropdown_placeholder');
	const searchOptions = page.locator('.toggle-group');
	const searchLine = page.locator('.header__search-line');
	const toggleButtons = searchOptions.locator('button');
	const selectedTypeLabel = searchOptions.locator('strong');

	const globalSearchInput = searchLine.getByLabel('Globalsearch');
	const perspectiveSelect = searchLine.getByText(perspectivePlaceholder, { exact: true });
	const paraQueriesSelect = searchLine.getByText(paraQueriesPlaceholder, { exact: true });

	const assertUserSeesGlobalSearch = async () => {
		await expect(globalSearchInput).toBeVisible();
		await expect(perspectiveSelect).toHaveCount(0);
		await expect(paraQueriesSelect).toHaveCount(0);
	};

	const assertUserSeesPerspectiveFinder = async () => {
		await expect(perspectiveSelect).toBeVisible();
		await expect(globalSearchInput).toHaveCount(0);
		await expect(paraQueriesSelect).toHaveCount(0);
	};

	const assertUserSeesParaQueries = async () => {
		await expect(paraQueriesSelect).toBeVisible();
		await expect(globalSearchInput).toHaveCount(0);
		await expect(perspectiveSelect).toHaveCount(0);
	};

	await expect(toggleButtons).toHaveCount(4);

	await toggleButtons.nth(0).click();
	await expect(selectedTypeLabel).toHaveText(cypherLabel);
	await assertUserSeesGlobalSearch();

	await toggleButtons.nth(1).click();
	await expect(selectedTypeLabel).toHaveText(fullTextLabel);
	await assertUserSeesGlobalSearch();

	await toggleButtons.nth(2).click();
	await expect(selectedTypeLabel).toHaveText(perspectiveLabel);
	await assertUserSeesPerspectiveFinder();

	await toggleButtons.nth(3).click();
	await expect(selectedTypeLabel).toHaveText(paraQueriesLabel);
	await assertUserSeesParaQueries();

	// go back to cypher-query search results
	await toggleButtons.nth(0).click();
};
