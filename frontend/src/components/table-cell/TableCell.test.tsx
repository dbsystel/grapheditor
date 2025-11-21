import { TableCell } from 'src/components/table-cell/TableCell';
import { render } from 'vitest-browser-react';

describe('Components - TableCell', () => {
	test('Render component', async () => {
		const screen = await render(<TableCell />);

		expect(screen.getByRole('cell').element()).toBeInTheDocument();
	});

	test('Render children', async () => {
		const screen = await render(
			<TableCell>
				<button>Hello</button>
			</TableCell>
		);

		const button = screen.getByRole('button').element();

		expect(button).toBeInTheDocument();
		expect(button.textContent).toBe('Hello');
	});
});
