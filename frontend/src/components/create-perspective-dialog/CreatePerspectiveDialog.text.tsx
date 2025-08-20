import { userEvent } from '@vitest/browser/context';
import * as perspectiveHandlers from 'src/tests/handlers/perspectives';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { CreatePerspectiveDialog } from './CreatePerspectiveDialog';

describe('Components - CreatePerspectiveDialog', () => {
	it('Render component', async () => {
		const screen = render(
			<CreatePerspectiveDialog closeFunction={() => {}} testId="create-perspective-save" />
		);

		const headline = screen.getByTestId('header_create_new_perspective_title');
		const closeButton = screen.getByTestId('close_button');
		const perspectiveTitleInput = screen.getByTestId('create_perspective_title_input');
		const saveButton = screen.getByTestId('create-perspective-save');

		expect(headline).toBeInTheDocument();
		expect(closeButton).toBeInTheDocument();
		expect(perspectiveTitleInput).toBeInTheDocument();
		expect(saveButton).toBeInTheDocument();
	});

	it('close component', async () => {
		const onClose = vi.fn();

		const screen = render(<CreatePerspectiveDialog closeFunction={onClose} />);

		const closeButton = screen.getByTestId('close_button');

		expect(closeButton).toBeInTheDocument();
		await userEvent.click(closeButton);
		expect(onClose).toHaveBeenCalled();
	});

	it('Create Perspective', async () => {
		const onClose = vi.fn();

		const screen = render(
			<CreatePerspectiveDialog closeFunction={onClose} testId="create-perspective-save" />
		);

		const perspectiveTitleInput = screen.getByTestId('create_perspective_title_input');
		const saveButton = screen.getByTestId('create-perspective-save');

		expect(perspectiveTitleInput).toBeInTheDocument();
		expect(saveButton).toBeInTheDocument();

		await userEvent.type(perspectiveTitleInput, 'New Perspective');
		await userEvent.click(saveButton);

		await vi.waitFor(() => {
			expect(perspectiveHandlers.perspectiveCreateCalled).toBe(1);
			expect(onClose).toHaveBeenCalled();
		});
	});
});
