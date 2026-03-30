import { Perspective } from 'src/models/perspective';
import { usePerspectiveStore } from 'src/stores/perspective';
import { generateTestPerspective } from 'src/tests/helpers';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { HeaderPerspectiveDeleteButton } from './HeaderPerspectiveDeleteButton';

describe('Components - HeaderPerspectiveDelete', () => {
	const perspective = generateTestPerspective();

	it('Render component', async () => {
		usePerspectiveStore.getState().setPerspective(perspective);
		const screen = await render(
			<HeaderPerspectiveDeleteButton
				perspectiveId={perspective.id}
				closeMenuFunction={() => {}}
				testId="header-perspective-delete"
			/>
		);

		const button = screen.getByTestId('header-perspective-delete');

		expect(button).toBeInTheDocument();
	});

	it('Delete Perspective', async () => {
		vi.spyOn(window, 'confirm').mockReturnValueOnce(true);
		usePerspectiveStore.getState().setPerspective(perspective);

		const screen = await render(
			<HeaderPerspectiveDeleteButton
				perspectiveId={perspective.id}
				closeMenuFunction={() => {}}
				testId="header-perspective-delete"
			/>
		);

		const button = screen.getByTestId('header-perspective-delete');
		await userEvent.click(button);

		await vi.waitFor(() => {
			usePerspectiveStore.getState().reset();
			expect(usePerspectiveStore.getState().perspective).toBeNull();
		});
	});
});
