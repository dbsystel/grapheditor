import { ItemOverviewTooltip } from 'src/components/item-overview-tooltip/ItemOverviewTooltip';
import i18n from 'src/i18n';
import { testNodes } from 'src/tests/data/nodes';
import { idFormatter } from 'src/utils/idFormatter';
import { render } from 'vitest-browser-react';

describe('Components - ItemOverviewTooltip', () => {
	const node = testNodes[0];

	test('modal content', async () => {
		const screen = render(<ItemOverviewTooltip item={node} tooltipRef={null} />);

		const buttons = screen.getByRole('button').elements();
		const modal = screen.getByRole('dialog').element();
		const title = screen.getByRole('heading', { level: 6 });

		expect(title).toHaveTextContent(node.title);
		expect(screen.getByText(node.description)).toBeInTheDocument();
		expect(screen.getByText(node.id)).toBeInTheDocument();
		expect(screen.getByText(i18n.t('single_view_description'))).toBeInTheDocument();
		expect(screen.getByText(i18n.t('item_overview_tooltip_labels'))).toBeInTheDocument();
		expect(
			screen.getByText(i18n.t('item_overview_tooltip_property_title'))
		).toBeInTheDocument();

		node.labels.forEach((label) => {
			expect(screen.getByText(idFormatter.parseIdToName(label))).toBeInTheDocument();
		});

		expect(buttons).toHaveLength(6);
		expect(modal).toBeInTheDocument();
	});
});
