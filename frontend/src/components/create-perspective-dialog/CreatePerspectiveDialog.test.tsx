import { userEvent } from '@vitest/browser/context';
import { Notifications } from 'src/components/notifications/Notifications';
import i18n from 'src/i18n';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { CreatePerspectiveDialog } from './CreatePerspectiveDialog';

// TODO mocking not working in pipeline (locally ok), fix this
// This might have something with different node versions (local 20.x.x, pipeline 22.x.x)

// vi.mock('src/utils/helpers/perspectives', () => ({
// 	preparePerspectiveDataAndRefreshNodesPosition: vi.fn(() => ({
// 		nodePositions: {
// 			'node-1': { x: 100, y: 200 },
// 			'node-2': { x: 300, y: 400 }
// 		},
// 		relationIds: ['relation-1', 'relation-2']
// 	}))
// }));

describe('Components - CreatePerspectiveDialog', () => {
	it('Render component', async () => {
		const screen = render(
			<CreatePerspectiveDialog closeFunction={() => {}} testId="create-perspective-save" />
		);

		const perspectiveTitleInput = screen.getByTestId('create_perspective_title_input');
		const saveButton = screen.getByRole('button', {
			name: i18n.t('header_create_new_perspective_save_button')
		});

		expect(perspectiveTitleInput).toBeInTheDocument();
		expect(saveButton).toBeInTheDocument();
	});

	// it('Create Perspective', async () => {
	// 	const onClose = vi.fn();
	//
	// 	const screen = render(
	// 		<div>
	// 			<CreatePerspectiveDialog closeFunction={onClose} testId="create-perspective-save" />
	// 			<Notifications />
	// 		</div>
	// 	);
	//
	// 	const perspectiveTitleInput = screen.getByTestId('create_perspective_title_input');
	// 	const saveButton = screen.getByRole('button', {
	// 		name: i18n.t('header_create_new_perspective_save_button')
	// 	});
	//
	// 	expect(perspectiveTitleInput).toBeInTheDocument();
	// 	expect(saveButton).toBeInTheDocument();
	//
	// 	await userEvent.type(perspectiveTitleInput, 'New Perspective');
	// 	await userEvent.click(saveButton);
	//
	// 	await vi.waitFor(() => {
	// 		expect(onClose).toHaveBeenCalled();
	// 		expect(
	// 			screen.getByText(i18n.t('notifications_success_perspective_create'))
	// 		).toBeInTheDocument();
	// 	});
	// });
});
