import { HomepageQueriesList } from 'src/models/homepage';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { Queries } from './Queries';

// Mirrors the shape of "queriesList" from backend/static/homepage.json
const queries: HomepageQueriesList = [
	{
		type: 'full-text',
		query: 'alice',
		title: 'full-text example',
		description: 'Updates the status of a specific order to shipped.'
	},
	{
		title: 'Query group example',
		queries: [
			{
				type: 'full-text',
				query: 'alice',
				title: 'full-text example',
				description: 'Updates the status of a specific order to shipped.'
			},
			{
				type: 'para-query',
				queryParameters: {
					label: 'MetaProperty__tech_'
				},
				title: 'para-query example',
				description: 'Return all nodes of a certain type',
				nodeId: 'id::4:bb368931-775e-4eb9-a9fd-a06c3b6efc14:25'
			}
		]
	},
	{
		type: 'cypher-query',
		query: 'match (a) optional match (a)-[r]->(b) return * limit 30',
		title: 'cypher-query example',
		description: 'Default cypher query with limit 30'
	},
	{
		type: 'perspective',
		title: 'perspective example',
		description: 'A saved perpspective',
		nodeId: 'id::4:bb368931-775e-4eb9-a9fd-a06c3b6efc14:30'
	}
];

const firstQuery = queries[0];

describe('Components - Queries', () => {
	test('Renders a card for every top-level query with its title and description', async () => {
		const onPlayClick = vi.fn();
		const screen = await render(<Queries queries={queries} onPlayClick={onPlayClick} />);

		await expect.element(screen.getByText('full-text example').first()).toBeInTheDocument();
		await expect.element(screen.getByText('cypher-query example')).toBeInTheDocument();
		await expect.element(screen.getByText('perspective example')).toBeInTheDocument();
		await expect
			.element(screen.getByText('Updates the status of a specific order to shipped.').first())
			.toBeInTheDocument();
	});

	test('Renders nested query groups with their own title and nested queries, and the correct number of cards', async () => {
		const onPlayClick = vi.fn();
		const screen = await render(<Queries queries={queries} onPlayClick={onPlayClick} />);

		await expect.element(screen.getByText('Query group example')).toBeInTheDocument();
		await expect.element(screen.getByText('para-query example')).toBeInTheDocument();

		// 1 top-level full-text + 2 nested (full-text, para-query) + cypher-query + perspective = 5 cards
		const cards = screen.container.querySelectorAll('.queries__card');
		expect(cards.length).toBe(5);
	});

	test('Calls onPlayClick with the corresponding query when its play button is clicked', async () => {
		const onPlayClick = vi.fn();
		const screen = await render(<Queries queries={queries} onPlayClick={onPlayClick} />);

		const buttons = screen.getByRole('button').elements();
		expect(buttons.length).toBeGreaterThan(0);

		await screen.getByRole('button').first().click();

		expect(onPlayClick).toHaveBeenCalledOnce();
		expect(onPlayClick).toHaveBeenCalledWith(firstQuery);
	});
});
