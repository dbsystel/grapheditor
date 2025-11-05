import { Modal } from './Modal';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

describe('Components - Modal', () => {
	it('Render component', async () => {
		const screen = render(
			<Modal isOpen={true} headline="Test Headline" description="Test Description" />
		);

		const modalHeader = screen.getByRole('heading', {
			name: 'Test Headline'
		});
		const modalDescription = screen.getByText('Test Description');
		const closeButton = screen.getByRole('button');

		expect(modalHeader).toBeInTheDocument();
		expect(modalDescription).toBeInTheDocument();
		expect(closeButton).toBeInTheDocument();
	});

	it('should call onClose when close button is clicked', async () => {
		const onCloseMock = vi.fn();
		const screen = render(
			<Modal
				isOpen={true}
				onClose={onCloseMock}
				headline="Test Headline"
				description="Test Description"
			/>
		);

		const closeButton = screen.getByRole('button');
		await closeButton.click();

		expect(onCloseMock).toHaveBeenCalledOnce();
	});

	it('should render children content', () => {
		const screen = render(
			<Modal isOpen={true}>
				<div>Test Content</div>
			</Modal>
		);

		expect(screen.getByText('Test Content')).toBeInTheDocument();
	});

	it('should not render header when showHeader is false', () => {
		const screen = render(<Modal isOpen={true} />);

		const modalHeader = screen.container.querySelector("[role='heading']");
		const closeButton = screen.container.querySelector("[role='button']");

		expect(modalHeader).toBe(null);
		expect(closeButton).toBe(null);
	});
});
