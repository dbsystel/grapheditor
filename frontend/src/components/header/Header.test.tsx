import { MemoryRouter } from 'react-router-dom';
import { useSearchStore } from 'src/stores/search';
import { GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVE } from 'src/utils/constants';
import { describe, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { Header } from './Header';

describe('Components - Header', () => {
	it('Show search Start Button', async () => {
		useSearchStore.getState().setType('full-text');
		const screen = await render(
			<MemoryRouter>
				<Header />
			</MemoryRouter>
		);

		const startButton = screen.getByText('Start');
		expect(startButton).toBeInTheDocument();
	});

	it('show manage perspective button', async () => {
		useSearchStore.getState().setType(GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVE);
		const screen = await render(
			<MemoryRouter>
				<Header />
			</MemoryRouter>
		);

		const managePerspectiveButton = screen.getByTestId('header_perspective_menu_button');
		expect(managePerspectiveButton).toBeInTheDocument();
	});
});
