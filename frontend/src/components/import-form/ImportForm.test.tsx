import { describe, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { ImportForm } from './ImportForm';

describe('Components ImportForm', () => {
	it('renders correctly', async () => {
		const screen = await render(<ImportForm />);

		const formElement = screen.getByRole('form');
		expect(formElement).toBeInTheDocument();
	});
});
