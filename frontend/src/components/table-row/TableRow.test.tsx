import { TableCell } from 'src/components/table-cell/TableCell';
import { TableRow } from 'src/components/table-row/TableRow';
import { render } from 'vitest-browser-react';

describe('Components - TableRow', () => {
	test('Render component', async () => {
		const screen = await render(<TableRow />);

		expect(screen.getByRole('row').element()).toBeInTheDocument();
	});

	test('Render children', async () => {
		const screen = await render(
			<TableRow>
				<TableCell>Hello</TableCell>
			</TableRow>
		);

		const row = screen.getByRole('row').element();
		const cell = screen.getByRole('cell').element();

		expect(row).toBeInTheDocument();
		expect(cell).toBeInTheDocument();
		expect(cell.textContent).toBe('Hello');
	});
});
