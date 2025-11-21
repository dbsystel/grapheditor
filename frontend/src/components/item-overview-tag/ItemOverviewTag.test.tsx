import { testNodes } from 'src/tests/data/nodes';
import { idFormatter } from 'src/utils/idFormatter';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { ItemOverviewButton } from '../item-overview-button/ItemOverviewButton';

describe('Components - ItemOverviewTag', () => {
	const node = testNodes[0];

	test('Render component', async () => {
		const screen = await render(<ItemOverviewButton nodeId={node.id} />);
		const button = screen.getByRole('button').element();

		expect(button).toBeInTheDocument();
	});

	test('Render node title as component text', async () => {
		const screen = await render(<ItemOverviewButton nodeId={node.id} />);
		const button = screen.getByRole('button').element();

		expect(button.textContent).toBe(idFormatter.parseIdToName(node.id));
	});

	test('Render elements on hover', async () => {
		vi.useFakeTimers();

		const screen = await render(<ItemOverviewButton nodeId={node.id} />);
		const button = screen.getByRole('button').element();

		await userEvent.hover(button);

		await vi.waitFor(() => {
			expect(screen.getByText('Loading...')).toBeInTheDocument();
		});

		await vi.runOnlyPendingTimersAsync();

		await vi.waitFor(() => {
			expect(screen.getByText('Loading...').query()).toBeNull();
		});

		expect(screen.getByRole('dialog')).toBeInTheDocument();

		await userEvent.unhover(button);

		vi.useRealTimers();
	});
});
