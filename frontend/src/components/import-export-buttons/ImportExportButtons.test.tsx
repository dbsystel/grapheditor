import { useImportExportStore } from 'src/stores/import-export';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { ImportExportButtons } from './ImportExportButtons';

describe('Components ImportExportButtons', () => {
	afterEach(() => {
		useImportExportStore.getState().close();
	});

	it('renders both buttons', async () => {
		const screen = await render(<ImportExportButtons />);

		await expect
			.element(screen.getByRole('button', { name: 'Datenexport' }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole('button', { name: 'Datenimport' }))
			.toBeInTheDocument();
	});

	it('opens the export modal when the export button is clicked', async () => {
		const screen = await render(<ImportExportButtons />);

		await screen.getByRole('button', { name: 'Datenexport' }).click();

		expect(useImportExportStore.getState().active).toBe('export');
	});

	it('opens the import modal when the import button is clicked', async () => {
		const screen = await render(<ImportExportButtons />);

		await screen.getByRole('button', { name: 'Datenimport' }).click();

		expect(useImportExportStore.getState().active).toBe('import');
	});
});
