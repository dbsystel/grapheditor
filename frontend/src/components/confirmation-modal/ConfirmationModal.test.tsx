import i18n from 'src/i18n';
import { useConfirmationModalStore } from 'src/stores/confirmation-modal';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { ConfirmationModal } from './ConfirmationModal';

describe('Components ConfirmationModal', () => {
	afterEach(() => {
		useConfirmationModalStore.getState().close();
	});

	it('renders nothing when store has no content', async () => {
		const screen = await render(<ConfirmationModal />);
		const modal = screen.container.querySelector('.confirmation-modal');

		expect(modal).toBeNull();
	});

	it('renders title and description when store has content', async () => {
		useConfirmationModalStore.getState().open({
			title: i18n.t('confirm_delete_node_title'),
			description: i18n.t('confirm_delete_node', { id: 'node-1' }),
			onConfirmClick: () => {},
			onCancelClick: () => {}
		});

		const screen = await render(<ConfirmationModal />);

		await expect
			.element(screen.getByText(i18n.t('confirm_delete_node_title')))
			.toBeInTheDocument();
		await expect
			.element(screen.getByText(i18n.t('confirm_delete_node', { id: 'node-1' })))
			.toBeInTheDocument();
	});

	it('calls onCancelClick when cancel button is clicked', async () => {
		const onCancelClick = vi.fn();

		useConfirmationModalStore.getState().open({
			title: i18n.t('confirm_delete_node_title'),
			description: i18n.t('confirm_delete_node', { id: 'node-1' }),
			onConfirmClick: () => {},
			onCancelClick
		});

		const screen = await render(<ConfirmationModal />);
		await screen.getByText(i18n.t('cancel')).click();

		expect(onCancelClick).toHaveBeenCalledOnce();
	});

	it('calls onConfirmClick when confirm button is clicked', async () => {
		const onConfirmClick = vi.fn();

		useConfirmationModalStore.getState().open({
			title: i18n.t('confirm_delete_node_title'),
			description: i18n.t('confirm_delete_node', { id: 'node-1' }),
			onConfirmClick,
			onCancelClick: () => {}
		});

		const screen = await render(<ConfirmationModal />);
		await screen.getByText(i18n.t('confirm')).click();

		expect(onConfirmClick).toHaveBeenCalledOnce();
	});

	it('renders custom button labels when provided', async () => {
		useConfirmationModalStore.getState().open({
			title: i18n.t('confirm_unsaved_changes_title'),
			description: i18n.t('confirm_unsaved_changes_description', { sectionName: 'Labels' }),
			onConfirmClick: () => {},
			onCancelClick: () => {},
			confirmLabel: i18n.t('confirm_unsaved_changes_save_button'),
			cancelLabel: i18n.t('confirm_unsaved_changes_cancel_button')
		});

		const screen = await render(<ConfirmationModal />);

		await expect
			.element(
				screen.getByRole('button', { name: i18n.t('confirm_unsaved_changes_save_button') })
			)
			.toBeInTheDocument();
		await expect
			.element(
				screen.getByRole('button', {
					name: i18n.t('confirm_unsaved_changes_cancel_button')
				})
			)
			.toBeInTheDocument();
	});
});
