import { expect } from '@playwright/test';
import { tmpdir } from 'os';
import { join } from 'path';
import { GLOBAL_SEARCH_CYPHER_QUERY_DEFAULT_SEARCH_VALUE } from 'src/utils/constants';
import { E2ETestFunctionProps } from '../E2E.interfaces';

export const _014_exportNodesAndRelations = async ({
	page,
	i18n
}: E2ETestFunctionProps): Promise<string> => {
	const cypherQueryTextarea = page.locator('.textarea-autosize textarea');
	const startButton = page.getByRole('button', { name: i18n.t('header_start_button') });

	await cypherQueryTextarea.fill(GLOBAL_SEARCH_CYPHER_QUERY_DEFAULT_SEARCH_VALUE);
	await startButton.click();
	// wait until the request finishes (stop button disappears, start button reappears)
	await expect(startButton).toBeVisible();

	const leftSidebar = page.locator('.left-widget').getByRole('complementary');

	// open the "Debug" accordion section
	const debugAccordionItem = leftSidebar.locator('details', {
		has: page.getByText(i18n.t('left_widget_debug_label'))
	});
	const debugAccordionHeadline = debugAccordionItem.locator('summary');

	// Debug section is expected to be closed at this point in the flow.
	// If it's already open, that indicates a bug elsewhere (state leaking
	// between tests), so fail fast instead of silently working around it.
	await expect(debugAccordionItem).not.toHaveAttribute('open', '');
	await debugAccordionHeadline.click();

	// click the export button
	await leftSidebar.getByRole('button', { name: i18n.t('import_export_buttons_export') }).click();

	// export modal opens - leave everything as-is and submit
	const exportModal = page.getByRole('dialog').filter({
		has: page.getByRole('heading', { name: i18n.t('import_export_export_modal_title') })
	});
	await expect(exportModal).toBeVisible();

	const [download] = await Promise.all([
		page.waitForEvent('download', { timeout: 60000 }),
		exportModal.getByRole('button', { name: i18n.t('export_form_submit_button') }).click()
	]);

	// verify download started
	const preparationNotification = page.locator('.notifications__notification', {
		hasText: i18n.t('notifications_info_export_preparation')
	});
	const downloadStartedNotification = page.locator('.notifications__notification', {
		hasText: i18n.t('notifications_info_export_title')
	});

	await expect(preparationNotification).toBeInViewport();
	await expect(downloadStartedNotification).toBeInViewport();

	// save the download using its actual suggested filename (e.g. "export.jsonl"),
	// so the file passed to the import test keeps the correct .jsonl extension -
	// download.path() alone returns a temp file without preserving the extension.
	const downloadedFilePath = join(tmpdir(), download.suggestedFilename());
	await download.saveAs(downloadedFilePath);

	return downloadedFilePath;
};
