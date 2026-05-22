import { Page } from '@playwright/test';
import { I18nType } from 'src/i18n';

export type E2ETestFunctionProps = {
	page: Page;
	i18n: I18nType;
};
