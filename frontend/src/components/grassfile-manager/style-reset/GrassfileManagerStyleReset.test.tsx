import { GrassfileManagerStyleReset } from './GrassfileManagerStyleReset';
import { render } from 'vitest-browser-react';

describe('Components - GrassfileManagerStyleReset', () => {
	test('Render component', () => {
		const screen = render(<GrassfileManagerStyleReset />);

		const button = screen.getByRole('button').element();

		expect(button).toBeInTheDocument();
	});
});
