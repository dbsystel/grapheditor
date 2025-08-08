import { TableCell } from 'src/components/table-cell/TableCell';
import { render } from 'vitest-browser-react';

describe('Components - TableCell', () => {
	test('Render component', () => {
		const screen = render(<TableCell />);

		expect(screen.getByRole('cell').element()).toBeInTheDocument();
	});

	test('Render children', () => {
		const screen = render(
			<TableCell>
				<button>Hello</button>
			</TableCell>
		);

		const button = screen.getByRole('button').element();

		expect(button).toBeInTheDocument();
		expect(button.textContent).toBe('Hello');
	});
});
