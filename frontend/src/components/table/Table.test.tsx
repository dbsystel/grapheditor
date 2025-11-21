import { Table } from 'src/components/table/Table';
import { render } from 'vitest-browser-react';

describe('Components - Table', () => {
	test('Render component', async () => {
		const screen = await render(<Table />);

		expect(screen.getByRole('table').element()).toBeInTheDocument();
	});

	test('Render children', async () => {
		const screen = await render(
			<Table>
				<button>Hello</button>
			</Table>
		);

		const button = screen.getByRole('button').element();

		expect(button).toBeInTheDocument();
		expect(button.textContent).toBe('Hello');
	});
});
