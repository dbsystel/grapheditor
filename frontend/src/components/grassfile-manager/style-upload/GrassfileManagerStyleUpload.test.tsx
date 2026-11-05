import i18n from 'src/i18n';
import { it } from 'vitest';
import { render } from 'vitest-browser-react';
import { GrassFileManagerStyleUpload } from './GrassfileManagerStyleUpload';

describe('GrassfileManagerStyleUpload', () => {
	it('Render component', async () => {
		const screen = await render(<GrassFileManagerStyleUpload />);

		const label = i18n.t('file_upload_grass_button_label');

		const fileInput = screen.getByLabelText(label).element();
		const cancelButton = screen.getByRole('button').filter({ hasText: i18n.t('cancel') });
		const uploadButton = screen.getByRole('button').filter({ hasText: i18n.t('upload') });

		expect(fileInput).toBeInTheDocument();
		expect(cancelButton).toBeInTheDocument();
		expect(uploadButton).toBeInTheDocument();
	});
});
