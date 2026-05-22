import { test as base } from '@playwright/test';
import i18n, { I18nType } from 'src/i18n';

export const extendedTest = base.extend<{
	i18n: I18nType;
}>({
	i18n: i18n
});
