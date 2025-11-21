import { Breadcrumbs } from 'src/components/breadcrumbs/Breadcrumbs';
import { render } from 'vitest-browser-react';

describe('Components - Table', () => {
	test('Render component', async () => {
		const screen = await render(<Breadcrumbs breadcrumbs={[{ text: 'Breadcrumb 1' }]} />);

		expect(screen.getByRole('navigation').element()).toBeInTheDocument();
		expect(screen.getByLabelText('breadcrumb').element()).toBeInTheDocument();
	});
});
