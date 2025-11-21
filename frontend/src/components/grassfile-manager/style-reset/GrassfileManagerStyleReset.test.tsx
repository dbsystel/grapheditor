import { render } from 'vitest-browser-react';
import { GrassfileManagerStyleReset } from './GrassfileManagerStyleReset';

describe('Components - GrassfileManagerStyleReset', () => {
	test('Render component', async () => {
		const screen = await render(<GrassfileManagerStyleReset />);

		const button = screen.getByRole('button').element();

		expect(button).toBeInTheDocument();
	});
});
