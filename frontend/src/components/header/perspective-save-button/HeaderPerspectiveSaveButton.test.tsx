import { HeaderPerspectiveSaveButton } from 'src/components/header/perspective-save-button/HeaderPerspectiveSaveButton';
import { useGraphStore } from 'src/stores/graph';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

describe('Components - HeaderPerspectiveSave', () => {
	const perspectiveId = 'node-0';

	it('Render component', async () => {
		useGraphStore.getState().setPerspectiveId(perspectiveId);

		const screen = await render(
			<HeaderPerspectiveSaveButton
				perspectiveId={perspectiveId}
				closeMenuFunction={() => {}}
				testId="header-perspective-save"
			/>
		);

		const button = screen.getByTestId('header-perspective-save');

		expect(button).toBeInTheDocument();
	});

	it('Save Perspective', async () => {
		useGraphStore.getState().setPerspectiveId(perspectiveId);
		const closeFunction = vi.fn();

		const screen = await render(
			<HeaderPerspectiveSaveButton
				perspectiveId={perspectiveId}
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
