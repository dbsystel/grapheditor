import { TableCell } from 'src/components/table-cell/TableCell';
import { TableHead } from 'src/components/table-head/TableHead';
import { TableRow } from 'src/components/table-row/TableRow';
import { render } from 'vitest-browser-react';

describe('Components - TableHead', () => {
	test('Render component', async () => {
		const screen = await render(<TableHead />);

		expect(screen.getByRole('rowgroup').element()).toBeInTheDocument();
	});

	test('Render children', async () => {
		const screen = await render(
			<TableHead>
				<TableRow>
					<TableCell>Hello</TableCell>
				</TableRow>
			</TableHead>
		);

		const row = screen.getByRole('row').element();
		const cell = screen.getByRole('cell').element();

		expect(row).toBeInTheDocument();
		expect(cell).toBeInTheDocument();
		expect(cell.textContent).toBe('Hello');
	});
});
