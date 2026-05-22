import { Page } from '@playwright/test';
import { I18nType } from 'src/i18n';
import { extendedTest } from 'src/tests/e2e-setup';
import { _001_loginAndChangeDatabase } from './001-login-and-change-database';
import { _002_closeCpuRenderingNotification } from './002-close-cpu-rendering-notification';
import { _003_searchTypeControlsVisibleComponents } from './003-search-type-controls-visible-components';
import { _004_nodeAddlabelAndSave } from './004-node-add-label-and-save';
import { _005_nodeRemoveLabelAndSave } from './005-node-remove-label-and-save';
import { _006_nodeCenter } from './006-node-center';
import { _007_switchBetweenPresentationOptions } from './007-switch-between-presentation-options';

extendedTest.describe('App E2E Flow', () => {
	extendedTest.describe.configure({ mode: 'serial' });

	let page: Page;
	let i18nInstance: I18nType;

	extendedTest.beforeAll(async ({ browser, i18n }) => {
		page = await browser.newPage();
		i18nInstance = i18n;
	});

	extendedTest.afterAll(async () => {
		await page.close();
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

	extendedTest.describe('Node - ItemsDrawer sidebar - Labels add and remove', () => {
		extendedTest('add a label to a node and save', async () => {
			await _004_nodeAddlabelAndSave({ page: page, i18n: i18nInstance });
		});

		extendedTest('remove the added label from a node and save', async () => {
			await _005_nodeRemoveLabelAndSave({ page: page, i18n: i18nInstance });
		});
	});

	extendedTest.describe('Node - ItemsDrawer sidebar - Center button', () => {
		extendedTest('click the center button', async () => {
			await _006_nodeCenter({ page: page, i18n: i18nInstance });
		});
	});

	extendedTest.describe('Left sidebar - Presentation options', () => {
		extendedTest('Switch between presentation options', async () => {
			await _007_switchBetweenPresentationOptions({ page: page, i18n: i18nInstance });
		});
	});
});
