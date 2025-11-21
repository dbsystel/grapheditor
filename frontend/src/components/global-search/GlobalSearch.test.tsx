import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { useSearchStore } from 'src/stores/search';
import { TEST_HOST } from 'src/tests/constants';
import { testExtend } from 'src/tests/test-extend';
import {
	APP_STORAGE_KEY_PREFIX,
	GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY,
	GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT
} from 'src/utils/constants';
import { endpoints } from 'src/utils/endpoints';
import { expect } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { GlobalSearch } from './GlobalSearch';

describe('Components - GlobalSearch', () => {
	const globalSearchRef = {
		current: {
			triggerSearch: () => {}
		}
	};

	const clearSearchEntries = () => {
		window.localStorage.removeItem(APP_STORAGE_KEY_PREFIX + 'search');

		useSearchStore.getState().history = {
			[GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY]: [],
			[GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT]: []
		};
	};

	test('Render component', async () => {
		const { container } = await render(
			<MemoryRouter>
				<GlobalSearch searchFunctionRef={globalSearchRef} />
			</MemoryRouter>
		);

		expect(container).toBeInTheDocument();
	});

	testExtend('History add entry', async ({ worker }) => {
		clearSearchEntries();

		worker.use(
			http.post(TEST_HOST + endpoints.getGlobalSearchPath(), () => {
				return HttpResponse.json({});
			})
		);

		const { getByRole } = await render(
			<MemoryRouter>
				<GlobalSearch searchFunctionRef={globalSearchRef} />
			</MemoryRouter>
		);

		const textarea = getByRole('textbox');

		await userEvent.click(textarea);
		await userEvent.clear(textarea);
		await userEvent.keyboard('0');
		await userEvent.keyboard('{Enter}');

		const selectedHistory = useSearchStore.getState().getSelectedHistory();

		if (!selectedHistory) {
			throw new Error('No selected history');
		}

		expect(selectedHistory).toHaveLength(1);
		expect(selectedHistory[0]).toBe('0');

		clearSearchEntries();
	});

	testExtend(
		'History prevent entry to be duplicate of the previous entry',
		async ({ worker }) => {
			clearSearchEntries();

			worker.use(
				http.post(TEST_HOST + endpoints.getGlobalSearchPath(), () => {
					return HttpResponse.json({});
				})
			);

			const { getByRole } = await render(
				<MemoryRouter>
					<GlobalSearch searchFunctionRef={globalSearchRef} />
				</MemoryRouter>
			);

			const textarea = getByRole('textbox');

			await userEvent.click(textarea);
			await userEvent.clear(textarea);
			await userEvent.keyboard('0');
			await userEvent.keyboard('{Enter}');
			await userEvent.keyboard('{Enter}');

			const selectedHistory = useSearchStore.getState().getSelectedHistory();

			if (!selectedHistory) {
				throw new Error('No selected history');
			}

			expect(selectedHistory).toHaveLength(1);
			expect(selectedHistory[0]).toBe('0');

			clearSearchEntries();
		}
	);
});
