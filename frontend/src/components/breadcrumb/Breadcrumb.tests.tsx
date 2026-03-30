import { testNodes } from 'src/tests/data/nodes';
import { describe, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { Breadcrumb } from './Breadcrumb';

describe('Components Breadcrumb', () => {
	it('renders correctly', async () => {
		const testNode = testNodes[0];
		const screen = await render(<Breadcrumb breadcrumb={{ item: testNode }} />);

		const heading = screen.getByText('Text');
		expect(heading).toBeInTheDocument();
	});
});
