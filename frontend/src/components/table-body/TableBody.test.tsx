import { TableBody } from 'src/components/table-body/TableBody';
import { render } from 'vitest-browser-react';

describe('Components - TableBody', () => {
	test('Render component', async () => {
		const screen = await render(<TableBody />);

		expect(screen.getByRole('rowgroup').element()).toBeInTheDocument();
	});

	test('Render children', async () => {
		const screen = await render(
			<TableBody>
				<button>Hello</button>
			</TableBody>
		);

		const button = screen.getByRole('button').element();

		expect(button).toBeInTheDocument();
		expect(button.textContent).toBe('Hello');
	});
});
