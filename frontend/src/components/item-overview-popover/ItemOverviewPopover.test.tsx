import { ItemOverviewPopover } from 'src/components/item-overview-popover/ItemOverviewPopover';
import i18n from 'src/i18n';
import { testNodes } from 'src/tests/data/nodes';
import { idFormatter } from 'src/utils/idFormatter';
import { vi } from 'vitest';
import { render } from 'vitest-browser-react';

describe('Components - ItemOverviewPopover', () => {
	const node = testNodes[0];

	test('modal content', async () => {
		const screen = await render(<ItemOverviewPopover item={node} popoverRef={null} />);
		const modal = screen.getByRole('dialog').element();

		expect(screen.getByText(node.title)).toBeInTheDocument();
		expect(screen.getByText(node.description)).toBeInTheDocument();
		expect(screen.getByText(node.id)).toBeInTheDocument();
		expect(screen.getByText(i18n.t('single_view_description'))).toBeInTheDocument();
		expect(screen.getByText(i18n.t('single_node_labels_title'))).toBeInTheDocument();
		expect(screen.getByText(i18n.t('single_view_properties_title'))).toBeInTheDocument();

		await vi.waitFor(() => {
			node.labels.forEach((label) => {
				expect(screen.getByText(idFormatter.parseIdToName(label))).toBeInTheDocument();
			});
		});

		expect(modal).toBeInTheDocument();
	});
});
