import { userEvent } from '@vitest/browser/context';
import { ItemOverviewButton } from 'src/components/item-overview-button/ItemOverviewButton';
import { testNodes } from 'src/tests/data/nodes';
import { idFormatter } from 'src/utils/idFormatter';
import { render } from 'vitest-browser-react';

describe('Components - ItemOverviewButton', () => {
	const node = testNodes[0];

	test('Render component', () => {
		const screen = render(<ItemOverviewButton nodeId={node.id} />);
		const button = screen.getByRole('button').element();

		expect(button).toBeInTheDocument();
	});

	test('Render node title as component text', () => {
		const screen = render(<ItemOverviewButton nodeId={node.id} />);
		const button = screen.getByRole('button').element();

		expect(button.textContent).toBe(idFormatter.parseIdToName(node.id));
	});

	test('Render elements on hover', async () => {
		vi.useFakeTimers();

		const screen = render(<ItemOverviewButton nodeId={node.id} />);
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
