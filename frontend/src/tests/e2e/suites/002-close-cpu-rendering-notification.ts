import { E2ETestFunctionProps } from '../E2E.interfaces';

export const _002_closeCpuRenderingNotification = async ({ page, i18n }: E2ETestFunctionProps) => {
	const notification = page.locator('.notifications__notification', {
		hasText: i18n.t(
			'notifications_warning_rendering_capabilities_software_rendering_fallback_used_title'
		)
	});

	const isVisible = await notification.isVisible();

	if (isVisible) {
		await notification.getByRole('button').click();
	}
};
