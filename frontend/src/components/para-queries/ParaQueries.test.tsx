import { userEvent } from '@vitest/browser/context';
import { ParaQueries } from 'src/components/para-queries/ParaQueries';
import { vi } from 'vitest';
import { render } from 'vitest-browser-react';

describe('Components - ParaQueries', () => {
	test('Options are shown + option click', async () => {
		const ref = { current: { triggerSearch: () => {} } };
		const screen = render(<ParaQueries searchFunctionRef={ref} />);

		const summary = screen.getByRole('group').element().getElementsByTagName('summary')[0];

		await userEvent.click(summary);

		const options = await vi.waitUntil(() => {
			const optionElements = screen.getByRole('listitem').elements();

			if (optionElements.length) {
				return optionElements;
			}

			return false;
		});

		expect(options).toHaveLength(2);
		expect(options[0]).toHaveTextContent(
			'Return all nodes that have a specific property and a certain value on a property.'
		);
		expect(options[1]).toHaveTextContent('Return all nodes of a certain type');
		expect(screen.container.firstElementChild?.childElementCount).toBe(1);

		await userEvent.click(options[0]);

		// check if the ParaQueryEditor component is rendered
		expect(screen.container.firstElementChild?.childElementCount).toBe(2);
	});
});
