import i18n from 'src/i18n';
import { it } from 'vitest';
import { render } from 'vitest-browser-react';
import { GrassFileManagerStyleUpload } from './GrassfileManagerStyleUpload';

describe('GrassfileManagerStyleUpload', () => {
	it('Render component', async () => {
		const screen = await render(<GrassFileManagerStyleUpload />);

		const label = i18n.t('file_upload_grass_button_label');

		const fileInput = screen.getByLabelText(label).element();
		const cancelButton = screen.getByRole('button', { name: 'cross' });
		const uploadButton = screen.getByRole('button', { name: 'check ' });

		expect(fileInput).toBeInTheDocument();
		expect(cancelButton).toBeInTheDocument();
		expect(uploadButton).toBeInTheDocument();
	});
});
