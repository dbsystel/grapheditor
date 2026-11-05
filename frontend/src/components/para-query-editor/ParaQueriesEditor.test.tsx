import { ParaQueryEditor } from 'src/components/para-query-editor/ParaQueryEditor';
import { testParaQueries } from 'src/tests/data/paraqueries';
import { clone } from 'src/utils/helpers/general';
import { vi } from 'vitest';
import { render } from 'vitest-browser-react';

describe('Components - ParaQueriesEditor', () => {
	test('ParaQuery is rendered', async () => {
		const paraQueries = clone(testParaQueries);
		const paraQuery = Object.values(paraQueries).at(0);
		const onParameterChange = vi.fn();

		if (!paraQuery) {
			throw new Error('No test para-queries');
		}
		const screen = await render(
			<ParaQueryEditor paraQuery={paraQuery} onParameterChange={onParameterChange} />
		);

		await new Promise((resolve) => setTimeout(resolve, 2000));

		const paraQueryEditorChildren = Array.from(screen.container.firstChild?.childNodes || []);
		const textNodes = paraQueryEditorChildren.filter((node) => {
			return node.nodeType === node.TEXT_NODE;
		});
		// the ComboBox component (used for parameters with "suggestions") renders its text
		// input wrapped in a ".combo-box" container, while plain parameters (no suggestions)
		// render a bare DBInput - distinguish them by whether the textbox is inside that wrapper
		const allTextInputs = screen.getByRole('textbox').elements();
		const inputsWithSuggestions = allTextInputs.filter((element) =>
			element.closest('.combo-box')
		);
		const inputsWithoutSuggestions = allTextInputs.filter(
			(element) => !element.closest('.combo-box')
		);

		const parameters = Array.from(paraQuery.user_text.match(/\$\w+/gim) || []).map((name) => {
			// easier to understand than working with capture groups
			return name.substring(1);
		});

		const firstParameterName = parameters.at(0) || '';
		const secondParameterName = parameters.at(1) || '';
		const thirdParameterName = parameters.at(2) || '';

		expect(paraQueryEditorChildren).toHaveLength(18);
		expect(inputsWithSuggestions).toHaveLength(2);
		expect(inputsWithoutSuggestions).toHaveLength(1);
		expect(textNodes).toHaveLength(0);

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
