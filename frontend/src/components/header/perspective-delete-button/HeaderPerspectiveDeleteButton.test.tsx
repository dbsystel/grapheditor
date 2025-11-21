import { HeaderPerspectiveDeleteButton } from 'src/components/header/perspective-delete-button/HeaderPerspectiveDeleteButton';
import { useGraphStore } from 'src/stores/graph';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

describe('Components - HeaderPerspectiveDelete', () => {
	const perspectiveId = 'node-0';

	it('Render component', async () => {
		useGraphStore.getState().setPerspectiveId(perspectiveId);
		const screen = await render(
			<HeaderPerspectiveDeleteButton
				perspectiveId={perspectiveId}
				closeMenuFunction={() => {}}
				testId="header-perspective-delete"
			/>
		);

		const button = screen.getByTestId('header-perspective-delete');

		expect(button).toBeInTheDocument();
	});

	it('Delete Perspective', async () => {
		vi.spyOn(window, 'confirm').mockReturnValueOnce(true);
		useGraphStore.getState().setPerspectiveId(perspectiveId);

		const screen = await render(
			<HeaderPerspectiveDeleteButton
				perspectiveId={perspectiveId}
				closeMenuFunction={() => {}}
				testId="header-perspective-delete"
			/>
		);

		const button = screen.getByTestId('header-perspective-delete');
		await userEvent.click(button);

		await vi.waitFor(() => {
			useGraphStore.getState().setPerspectiveId(null);
			expect(useGraphStore.getState().perspectiveId).toBeNull();
		});
	});
});
