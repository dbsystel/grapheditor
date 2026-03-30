import { HeaderPerspectiveSaveButton } from 'src/components/header/perspective-save-button/HeaderPerspectiveSaveButton';
import { usePerspectiveStore } from 'src/stores/perspective';
import { generateTestPerspective } from 'src/tests/helpers';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

describe('Components - HeaderPerspectiveSave', () => {
	const perspective = generateTestPerspective();

	it('Render component', async () => {
		usePerspectiveStore.getState().setPerspective(perspective);

		const screen = await render(
			<HeaderPerspectiveSaveButton
				perspectiveId={perspective.id}
				closeMenuFunction={() => {}}
				testId="header-perspective-save"
			/>
		);

		const button = screen.getByTestId('header-perspective-save');

		expect(button).toBeInTheDocument();
	});

	it('Save Perspective', async () => {
		usePerspectiveStore.getState().setPerspective(perspective);
		const closeFunction = vi.fn();

		const screen = await render(
			<HeaderPerspectiveSaveButton
				perspectiveId={perspective.id}
				closeMenuFunction={closeFunction}
				testId="header-perspective-save"
			/>
		);

		const button = screen.getByTestId('header-perspective-save');
		await userEvent.click(button);

		await vi.waitFor(() => {
			expect(closeFunction).toHaveBeenCalled();
		});
	});
});
