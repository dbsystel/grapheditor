import userEvent from '@testing-library/user-event';
import i18n from 'src/i18n';
import { useClipboardStore } from 'src/stores/clipboard';
import { generateTestNode } from 'src/tests/data/nodes';
import { generateTestRelation } from 'src/tests/data/relations';
import { expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { CopyToClipboard } from './CopyToClipboard';

describe('Components - CopyToClipboard', () => {
	test('Render component', () => {
		const screen = render(<CopyToClipboard nodes={[]} relations={[]} />);

		expect(screen.getByRole('button').element()).toBeInTheDocument();
		expect(screen.container.querySelector('[data-icon="copy"]')).toBeInTheDocument();
	});

	test('Copy functionality', async () => {
		const testNode = generateTestNode('test-n', [], []);
		const testRelation = generateTestRelation('test-r', 'test', [], 'test', 'test');

		/**
		 * 	@see https://testing-library.com/docs/user-event/clipboard/
		 */
		const screen = render(<CopyToClipboard nodes={[testNode]} relations={[testRelation]} />);

		const copyButton = screen.getByRole('button').element();

		await userEvent.click(copyButton);

		const clipboard = useClipboardStore.getState().clipboard;

		expect(clipboard).toEqual({
			nodes: [testNode],
			relations: [testRelation],
			graphNodes: [],
			graphRelations: []
		});
	});

	test('Successful copy GUI feedback', async () => {
		const screen = render(<CopyToClipboard nodes={[]} relations={[]} />);

		const copyButton = screen.getByRole('button').element();

		await userEvent.click(copyButton);

		const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();

		expect(tooltip).toBeInTheDocument();
		expect(tooltip).toHaveTextContent(i18n.t('clipboard_items_copied'));
	});
});
