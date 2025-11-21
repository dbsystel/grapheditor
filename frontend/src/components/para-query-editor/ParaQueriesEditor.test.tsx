import { ParaQueryEditor } from 'src/components/para-query-editor/ParaQueryEditor';
import { testParaQueries } from 'src/tests/data/paraqueries';
import { clone } from 'src/utils/helpers/general';
import { vi } from 'vitest';
import { render } from 'vitest-browser-react';

describe('Components - ParaQueriesEditor', () => {
	test('ParaQuery is rendered', async () => {
		const paraQueries = clone(testParaQueries);
		const paraQuery = paraQueries['id::4:bb368931-775e-4eb9-a9fd-a06c3b6efc14:0'];
		const onParameterChange = vi.fn();

		const screen = await render(
			<ParaQueryEditor paraQuery={paraQuery} onParameterChange={onParameterChange} />
		);

		const paraQueryEditorChildren = Array.from(screen.container.firstChild?.childNodes || []);
		const textNodes = paraQueryEditorChildren.filter((node) => {
			return node.nodeType === node.TEXT_NODE;
		});
		const inputsWithSuggestions = screen.getByRole('combobox').elements();
		const inputsWithoutSuggestions = screen.getByRole('textbox').elements();

		const parameters = Array.from(paraQuery.user_text.match(/\$\w+/gim) || []).map((name) => {
			// easier to understand than working with capture groups
			return name.substring(1);
		});

		const firstParameterName = parameters.at(0) || '';
		const secondParameterName = parameters.at(1) || '';
		const thirdParameterName = parameters.at(2) || '';

		expect(paraQueryEditorChildren).toHaveLength(7);
		expect(inputsWithSuggestions).toHaveLength(2);
		expect(inputsWithoutSuggestions).toHaveLength(1);
		expect(textNodes).toHaveLength(4);

		expect(inputsWithSuggestions[0]).toHaveValue(
			paraQuery.parameters[firstParameterName].default_value || ''
		);
		expect(inputsWithSuggestions[1]).toHaveValue(
			paraQuery.parameters[secondParameterName].default_value || ''
		);
		expect(inputsWithoutSuggestions[0]).toHaveValue(
			paraQuery.parameters[thirdParameterName].default_value || ''
		);
	});
});
