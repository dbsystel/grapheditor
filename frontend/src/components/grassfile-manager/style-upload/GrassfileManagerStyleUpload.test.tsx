import { GrassFileManagerStyleUpload } from './GrassfileManagerStyleUpload';
import { render } from 'vitest-browser-react';
import { vi, it } from 'vitest';

describe('GrassfileManagerStyleUpload', () => {
	it('Render component', () => {
		const screen = render(<GrassFileManagerStyleUpload />);

		const inputField = screen.getByRole('textbox').element();
		const cancelButton = screen.getByRole('button', { name: 'cross' });
		const uploadButton = screen.getByRole('button', { name: 'check ' });

		expect(inputField).toBeInTheDocument();
		expect(cancelButton).toBeInTheDocument();
		expect(uploadButton).toBeInTheDocument();
	});
});
