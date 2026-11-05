import { Page } from '@playwright/test';
import { I18nType } from 'src/i18n';
import { extendedTest } from 'src/tests/e2e-setup';
import { _000_loginAndTestTabScenarios } from './000-login-tab-scenarios';
import { _001_loginAndChangeDatabase } from './001-login-and-change-database';
import { _002_closeCpuRenderingNotification } from './002-close-cpu-rendering-notification';
import { _003_searchTypeControlsVisibleComponents } from './003-search-type-controls-visible-components';
import { _004_paraQueriesDropdown } from './004-para-queries-dropdown';
import { _005_nodeAddlabelAndSave } from './005-node-add-label-and-save';
import { _006_nodeRemoveLabelAndSave } from './006-node-remove-label-and-save';
import { _007_nodePropertiesAddProperty } from './007-node-properties-add-property';
import { _008_nodePropertiesDeleteProperty } from './008-node-properties-delete-property';
import { _009_nodeRelationsAddRelation } from './009-node-relations-add-relation';
import { _010_nodeRelationsDeleteRelation } from './010-node-relations-delete-relation';
import { _011_nodeCenter } from './011-node-center';
import { _012_switchBetweenPresentationOptions } from './012-switch-between-presentation-options';
import { _013_stopCypherQuery } from './013-stop-cypher-query';
import { _014_exportNodesAndRelations } from './014-export-nodes-and-relations';
import { _015_importNodesAndRelations } from './015-import-nodes-and-relations';

extendedTest.describe('App E2E Flow', () => {
	extendedTest.describe.configure({ mode: 'serial' });

	let page: Page;
	let i18nInstance: I18nType;
	let exportedFilePath = '';

	extendedTest.beforeAll(async ({ browser, i18n }) => {
		page = await browser.newPage();
		i18nInstance = i18n;
	});

	extendedTest.afterAll(async () => {
		await page.close();
	});

	extendedTest.afterEach(async () => {
		await page.waitForTimeout(1000); // pause after every test in this describe block
	});

	extendedTest.describe('App - Login tab scenarios', () => {
		extendedTest('login and cover all known tab scenarios', async ({ browser }) => {
			await _000_loginAndTestTabScenarios({ browser: browser, i18n: i18nInstance });
		});
	});

	extendedTest.describe('App - Login', () => {
		extendedTest('login and change database', async () => {
			await _001_loginAndChangeDatabase({ page: page, i18n: i18nInstance });
		});
	});

	extendedTest.describe('App - Close the CPU rendering warning notification', () => {
		extendedTest('close the CPU rendering warning notification', async () => {
			await _002_closeCpuRenderingNotification({ page: page, i18n: i18nInstance });
		});
	});

	extendedTest.describe('Header - Search options', () => {
		extendedTest('search type controls visible components', async () => {
			await _003_searchTypeControlsVisibleComponents({ page: page, i18n: i18nInstance });
		});
	});

	// runs right after the header search-option tests and before any node mutation/export/import
	// tests, so it operates on the pristine seed data (the para-queries' parameters rely on
	// "parameter__tech_" relationships that aren't guaranteed to survive the export/import
	// round-trip done by later tests, since that export is based on a capped/limited query)
	extendedTest.describe('Header - ParaQueries dropdown', () => {
		extendedTest(
			'open the ParaQueries dropdown, check its options and select one',
			async () => {
				await _004_paraQueriesDropdown({ page: page, i18n: i18nInstance });
			}
		);
	});

	extendedTest.describe('Node - ItemsDrawer sidebar - Labels add and remove', () => {
		extendedTest('add a label to a node and save', async () => {
			await _005_nodeAddlabelAndSave({ page: page, i18n: i18nInstance });
		});

		extendedTest('remove the added label from a node and save', async () => {
			await _006_nodeRemoveLabelAndSave({ page: page, i18n: i18nInstance });
		});
	});

	extendedTest.describe('Node - ItemsDrawer sidebar - Properties add and delete', () => {
		extendedTest('add a new property to a node', async () => {
			await _007_nodePropertiesAddProperty({ page: page, i18n: i18nInstance });
		});

		extendedTest('delete a property from a node', async () => {
			await _008_nodePropertiesDeleteProperty({ page: page, i18n: i18nInstance });
		});
	});

	extendedTest.describe('Node - ItemsDrawer sidebar - Relations add and delete', () => {
		extendedTest('add a relation to a node', async () => {
			await _009_nodeRelationsAddRelation({ page: page, i18n: i18nInstance });
		});

		extendedTest('delete a relation from a node', async () => {
			await _010_nodeRelationsDeleteRelation({ page: page, i18n: i18nInstance });
		});
	});

	extendedTest.describe('Node - ItemsDrawer sidebar - Center button', () => {
		extendedTest('click the center button', async () => {
			await _011_nodeCenter({ page: page, i18n: i18nInstance });
		});
	});

	extendedTest.describe('Left sidebar - Presentation options', () => {
		extendedTest('Switch between presentation options', async () => {
			await _012_switchBetweenPresentationOptions({ page: page, i18n: i18nInstance });
		});
	});

	extendedTest.describe('Header - Stop cypher query', () => {
		extendedTest('stop running cypher query', async () => {
			await _013_stopCypherQuery({ page: page, i18n: i18nInstance });
		});
	});

	extendedTest.describe('Header - Export nodes and relations', () => {
		extendedTest('export nodes and relations from the debug section', async () => {
			exportedFilePath = await _014_exportNodesAndRelations({
				page: page,
				i18n: i18nInstance
			});
		});
	});

	extendedTest.describe('Header - Import nodes and relations', () => {
		extendedTest('clear the graph and import the previously exported file', async () => {
			await _015_importNodesAndRelations({
				page: page,
				i18n: i18nInstance,
				importFilePath: exportedFilePath
			});
		});
	});
});
