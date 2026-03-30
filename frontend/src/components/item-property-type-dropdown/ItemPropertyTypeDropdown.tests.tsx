import { describe, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { ItemPropertyTypeDropdown } from './ItemPropertyTypeDropdown';

describe('Components ItemPropertyTypeDropdown', () => {
	it('renders correctly', async () => {
		const screen = await render(<ItemPropertyTypeDropdown value="string" />);

		const heading = screen.getByText('ItemPropertyTypeDropdown');
		expect(heading).toBeInTheDocument();
	});
});
