import { expect } from '@playwright/test';
import { E2ETestFunctionProps } from '../E2E.interfaces';

export const _013_stopCypherQuery = async ({ page, i18n }: E2ETestFunctionProps) => {
	const cypherQueryTextarea = page.locator('.textarea-autosize textarea');
	const startButton = page.getByRole('button', { name: i18n.t('header_start_button') });
	const stopButton = page.getByRole('button', { name: i18n.t('header_stop_button') });

	await expect(cypherQueryTextarea).toBeInViewport();
	await expect(startButton).toBeInViewport();

	await cypherQueryTextarea.fill('match (a) call apoc.util.sleep(10000) return a');

	await startButton.click();

	await expect(stopButton).toBeInViewport();

	await stopButton.click();

	const stopSucceededNotification = page.locator('.notifications__notification', {
		hasText: i18n.t('notifications_success_header_request_stop')
	});
	const alreadyProcessedNotification = page.locator('.notifications__notification', {
		hasText: i18n.t('notifications_info_header_request_already_processed')
	});

	// the backend may have already finished processing the request by the time it receives the stop signal, in which case
	// it reports "already processed" instead of "stopped" - either is an acceptable outcome here
	await expect(stopSucceededNotification.or(alreadyProcessedNotification)).toBeInViewport();
};
