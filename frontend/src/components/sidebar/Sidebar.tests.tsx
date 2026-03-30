import { describe, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { Sidebar } from './Sidebar';

describe('Components Sidebar', () => {
	it('renders correctly', async () => {
		const screen = await render(<Sidebar />);

		const heading = screen.getByText('Sidebar');
		expect(heading).toBeInTheDocument();
	});
});
