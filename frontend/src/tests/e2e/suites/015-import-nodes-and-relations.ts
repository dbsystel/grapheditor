import { expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { GLOBAL_SEARCH_CYPHER_QUERY_DEFAULT_SEARCH_VALUE } from 'src/utils/constants';
import { E2ETestFunctionProps } from '../E2E.interfaces';

type ImportNodesAndRelationsProps = E2ETestFunctionProps & {
	importFilePath: string;
};

type ExportedLine = { type: 'node' | 'relation' };

const countNodesAndRelations = (filePath: string) => {
	const content = readFileSync(filePath, 'utf-8');
	const lines = content
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	let nodeCount = 0;
	let relationCount = 0;

	for (const line of lines) {
		const parsed = JSON.parse(line) as ExportedLine;

		if (parsed.type === 'node') {
			nodeCount++;
		} else if (parsed.type === 'relation') {
			relationCount++;
		}
	}

	return {
		numberOfNodes: nodeCount,
		numberOfRelations: relationCount
	};
};

export const _015_importNodesAndRelations = async ({
	page,
	i18n,
	importFilePath
}: ImportNodesAndRelationsProps) => {
	const { numberOfNodes, numberOfRelations } = countNodesAndRelations(importFilePath);

	// clear the graph via the header cypher query textarea
	const cypherQueryTextarea = page.locator('.textarea-autosize textarea');
	const startButton = page.getByRole('button', { name: i18n.t('header_start_button') });

	await cypherQueryTextarea.fill('MATCH (n) DETACH DELETE n');
	await startButton.click();

	// wait until the request finishes (stop button disappears, start button reappears)
	await expect(startButton).toBeVisible();

	// verify the graph is now empty
	await expect(page.locator('.network-graph__node-label-container')).toHaveCount(0);

	// open the left sidebar's "Debug" section and click the import button
	const leftSidebar = page.locator('.left-widget').getByRole('complementary');

	await leftSidebar.getByRole('button', { name: i18n.t('import_export_buttons_import') }).click();

	const importModal = page.getByRole('dialog').filter({
		has: page.getByRole('heading', { name: i18n.t('import_export_import_modal_title') })
	});
	await expect(importModal).toBeVisible();

	// upload the previously exported file
	await importModal.locator('input[type="file"]').setInputFiles(importFilePath);

	// leave the default strategy as-is, submit the form
	await importModal.getByRole('button', { name: i18n.t('import_form_submit_button') }).click();

	// verify success notification reports the exact same counts found in the file
	const importSuccessNotification = page.locator('.notifications__notification', {
		hasText: i18n.t('import_form_success_title')
	});

	await expect(importSuccessNotification).toBeInViewport();
	await expect(importSuccessNotification).toContainText(
		i18n.t('import_form_success_description', {
			nodes: numberOfNodes,
			relations: numberOfRelations
		})
	);

	// importing data does not automatically refresh the graph view - run a
	// query to actually load and display the freshly imported nodes.
	await cypherQueryTextarea.fill(GLOBAL_SEARCH_CYPHER_QUERY_DEFAULT_SEARCH_VALUE);
	await startButton.click();

	// verify the graph was restored with the expected number of nodes
	await expect(page.locator('.network-graph__node-label-container')).toHaveCount(numberOfNodes);
};
