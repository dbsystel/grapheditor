import { Table } from 'src/components/table/Table';
import { render } from 'vitest-browser-react';

describe('Components - Table', () => {
	test('Render component', () => {
		const screen = render(<Table />);

		expect(screen.getByRole('table').element()).toBeInTheDocument();
	});

	test('Render children', () => {
		const screen = render(
			<Table>
				<button>Hello</button>
			</Table>
		);

		const button = screen.getByRole('button').element();

		expect(button).toBeInTheDocument();
		expect(button.textContent).toBe('Hello');
	});
});
