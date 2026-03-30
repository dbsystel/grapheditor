import { Breadcrumbs } from 'src/components/breadcrumbs/Breadcrumbs';
import { testNodes } from 'src/tests/data/nodes';
import { render } from 'vitest-browser-react';

describe('Components - Table', () => {
	test('Render component', async () => {
		const testNode = testNodes[0];
		const screen = await render(<Breadcrumbs breadcrumbs={[{ item: testNode }]} />);

		expect(screen.getByRole('navigation').element()).toBeInTheDocument();
		expect(screen.getByLabelText('breadcrumb').element()).toBeInTheDocument();
	});
});
