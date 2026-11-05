import i18n from 'src/i18n';
import { useImportExportStore } from 'src/stores/import-export';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { ImportExportModals } from './ImportExportModals';

describe('Components ImportExportModals', () => {
	afterEach(() => {
		useImportExportStore.getState().close();
	});

	it('renders nothing when no modal is active', async () => {
		const screen = await render(<ImportExportModals />);
		const modal = screen.container.querySelector('.import-export-modals');

		expect(modal).toBeNull();
	});

	it('renders the export modal when export is active', async () => {
		useImportExportStore.getState().openExportModal();

		const screen = await render(<ImportExportModals />);

		await expect
			.element(screen.getByText(i18n.t('import_export_export_modal_title')))
			.toBeInTheDocument();
	});

	it('renders the import modal when import is active', async () => {
		useImportExportStore.getState().openImportModal();

		const screen = await render(<ImportExportModals />);

		await expect
			.element(screen.getByText(i18n.t('import_export_import_modal_title')))
			.toBeInTheDocument();
	});
});
