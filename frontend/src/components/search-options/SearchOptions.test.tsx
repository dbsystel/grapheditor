import i18n from 'src/i18n';
import { Database } from 'src/models/database';
import { useDatabaseStore } from 'src/stores/database';
import { useSearchStore } from 'src/stores/search';
import {
	GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY,
	GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT
} from 'src/utils/constants';
import { describe, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { SearchOptions } from './SearchOptions';

const DATABASE_WITH_PERSPECTIVES: Database = {
	name: 'test-db',
	status: 'online',
	type: 'standard',
	features: ['Perspectives']
};

const DATABASE_WITHOUT_PERSPECTIVES: Database = {
	name: 'test-db',
	status: 'online',
	type: 'standard',
	features: []
};

describe('Components - SearchOptions', () => {
	it('renders all search type options as buttons', async () => {
		const screen = await render(<SearchOptions />);

		const buttons = screen.getByRole('button');
		// Cypher, Full-text, Perspective, ParaQueries
		expect(buttons.length).toBe(4);
	});

	it('renders with cypher query selected by default', async () => {
		useSearchStore.getState().setType(GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY);

		const screen = await render(<SearchOptions />);

		const selectedLabel = screen.getByRole('strong', {
			hasText: i18n.t('global_search_cypher_query')
		});
		expect(selectedLabel).toBeInTheDocument();
	});

	it('disables the perspective option when the database does not support perspectives', async () => {
		useDatabaseStore.getState().setCurrentDatabase(DATABASE_WITHOUT_PERSPECTIVES);

		const screen = await render(<SearchOptions />);

		const buttons = screen.getByRole('button').elements();
		// Perspective is the third button (index 2)
		const perspectiveButton = buttons[2];

		expect(perspectiveButton).toBeDefined();
		expect(perspectiveButton?.getAttribute('disabled')).not.toBeNull();
	});

	it('disables the perspective option when no database is set', async () => {
		useDatabaseStore.getState().reset();

		const screen = await render(<SearchOptions />);

		const buttons = screen.getByRole('button').elements();
		const perspectiveButton = buttons[2];

		expect(perspectiveButton).toBeDefined();
		expect(perspectiveButton?.getAttribute('disabled')).not.toBeNull();
	});

	it('enables the perspective option when the database supports perspectives', async () => {
		useDatabaseStore.getState().setCurrentDatabase(DATABASE_WITH_PERSPECTIVES);

		const screen = await render(<SearchOptions />);

		const buttons = screen.getByRole('button').elements();
		const perspectiveButton = buttons[2];

		expect(perspectiveButton).toBeDefined();
		expect(perspectiveButton?.getAttribute('disabled')).toBeNull();
	});

	it('shows the correct tooltip for perspective when not supported', async () => {
		useDatabaseStore.getState().setCurrentDatabase(DATABASE_WITHOUT_PERSPECTIVES);

		const screen = await render(<SearchOptions />);

		const tooltip = screen.getByText(
			i18n.t('global_search_perspective_not_supported_by_database')
		);
		expect(tooltip).toBeInTheDocument();
	});

	it('shows the correct tooltip for perspective when supported', async () => {
		useDatabaseStore.getState().setCurrentDatabase(DATABASE_WITH_PERSPECTIVES);

		const screen = await render(<SearchOptions />);

		const tooltip = screen.getByText(i18n.t('global_search_perspective'));
		expect(tooltip).toBeInTheDocument();
	});

	it('changes search type when a different option is clicked', async () => {
		useSearchStore.getState().setType(GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY);

		const screen = await render(<SearchOptions />);

		const buttons = screen.getByRole('button').elements();
		// Full-text is the second button (index 1)
		const fullTextButton = buttons[1];

		if (!fullTextButton || !(fullTextButton instanceof HTMLElement)) {
			throw new Error('Full-text button not found');
		}

		await fullTextButton.click();

		expect(useSearchStore.getState().type).toBe(GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT);
	});

	it('updates the selected label when search type changes', async () => {
		useSearchStore.getState().setType(GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT);

		const screen = await render(<SearchOptions />);

		const selectedLabel = screen.getByRole('strong', {
			hasText: i18n.t('global_search_full_text')
		});
		expect(selectedLabel).toBeInTheDocument();
	});

	it('passes id, className, and testId to the ToggleGroup', async () => {
		const screen = await render(
			<SearchOptions id="my-id" className="my-class" testId="my-test-id" />
		);

		const root = screen.container.querySelector('#my-id');
		expect(root).not.toBeNull();
		expect(root?.classList.contains('my-class')).toBe(true);

		const testIdElement = screen.container.querySelector('[data-testid="my-test-id"]');
		expect(testIdElement).not.toBeNull();
	});
});
