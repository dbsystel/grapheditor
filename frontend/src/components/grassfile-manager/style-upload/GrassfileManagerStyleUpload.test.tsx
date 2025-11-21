import { it } from 'vitest';
import { render } from 'vitest-browser-react';
import { GrassFileManagerStyleUpload } from './GrassfileManagerStyleUpload';

describe('GrassfileManagerStyleUpload', () => {
	it('Render component', async () => {
		const screen = await render(<GrassFileManagerStyleUpload />);

		const inputField = screen.getByRole('textbox').element();
		const cancelButton = screen.getByRole('button', { name: 'cross' });
		const uploadButton = screen.getByRole('button', { name: 'check ' });

		expect(inputField).toBeInTheDocument();
		expect(cancelButton).toBeInTheDocument();
		expect(uploadButton).toBeInTheDocument();
	});
});
