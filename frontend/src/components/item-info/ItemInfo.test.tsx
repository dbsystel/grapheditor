import { ItemInfo } from 'src/components/item-info/ItemInfo';
import { testNodes } from 'src/tests/data/nodes';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

describe('Components - ItemInfo', () => {
	const node = testNodes[0];

	test('Render component', async () => {
		const screen = await render(<ItemInfo item={node} />);
		const button = screen.getByRole('button').element();

		expect(button).toBeInTheDocument();
	});

	test('Render node title as component text', async () => {
		const screen = await render(<ItemInfo item={node} />);
		const button = screen.getByRole('button').element();

		expect(button.textContent).toBe(node.title);
	});

	test('Render elements on hover', async () => {
		vi.useFakeTimers();

		const screen = await render(<ItemInfo item={node} />);
		const button = screen.getByRole('button').element();

		await userEvent.hover(button);

		vi.runOnlyPendingTimers();

		await vi.waitFor(() => {
			expect(screen.getByRole('dialog')).toBeInTheDocument();
		});

		await userEvent.unhover(button);

		vi.useRealTimers();
	});
});
