import { MemoryRouter } from 'react-router-dom';
import { useSearchStore } from 'src/stores/search';
import { describe, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { Header } from './Header';

describe('Components - Header', () => {
	it('Show search Start Button', () => {
		useSearchStore.getState().setType('full-text');
		const screen = render(
			<MemoryRouter>
				<Header />
			</MemoryRouter>
		);

		const startButton = screen.getByText('Start');
		expect(startButton).toBeInTheDocument();
	});

	it('show manage perspective button', () => {
		useSearchStore.getState().setType('perspectives');
		const screen = render(
			<MemoryRouter>
				<Header />
			</MemoryRouter>
		);

		const managePerspectiveButton = screen.getByTestId('header_perspective_menu_button');
		expect(managePerspectiveButton).toBeInTheDocument();
	});
});
