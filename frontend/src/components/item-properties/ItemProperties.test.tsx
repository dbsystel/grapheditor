import i18n from 'src/i18n';
import { MetaForMeta } from 'src/models/node';
import { testNodes } from 'src/tests/data/nodes';
import { idFormatter } from 'src/utils/idFormatter';
import { expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { ItemProperties } from './ItemProperties';

describe('Components - ItemProperties', () => {
	const node = testNodes[0];

	const meta: MetaForMeta = {
		'MetaRelation::likes__dummy_': [
			{
				description: 'since when some relation holds',
				labels: ['MetaLabel::___tech_', 'MetaLabel::MetaProperty__tech_'],
				longDescription: 'Long description',
				properties: {
					'MetaProperty::_uuid__tech_': {
						edit: true,
						type: 'string',
						value: '8f6138dd-b74f-4962-b008-b4667a4ffe2d'
					},
					'MetaProperty::description__tech_': {
						edit: true,
						type: 'string',
						value: 'since when some relation holds'
					},
					'MetaProperty::name__tech_': {
						edit: true,
						type: 'string',
						value: 'since__dummy_'
					},
					'MetaProperty::type__tech_': {
						edit: true,
						type: 'string',
						value: 'integer'
					}
				},
				title: 'since__dummy_',
				id: 'id::4:866c0a6a-e058-427d-88f0-c972970a0b43:9',
				dbId: 'id::4:866c0a6a-e058-427d-88f0-c972970a0b43:9',
				semanticId: 'MetaProperty::since__dummy_',
				style: {
					color: '#D7E3BF',
					'border-color': '#000000',
					'border-width': '1px',
					'text-color-internal': '#000000',
					caption:
						'MetaProperty<sub style="opacity: 0.6">__tech_</sub><br/><br/><br/>since<sub style="opacity: 0.6">__dummy_</sub><br><br>(9)'
				},
				_grapheditor_type: 'node'
			}
		]
	};

	test('Render component', async () => {
		const screen = render(<ItemProperties item={node} metaData={meta} />);
		const tabs = screen.getByRole('tab');

		await vi.waitFor(() => {
			expect(tabs.elements().length).toBe(2);
			expect(screen.getByText(i18n.t('tab_title_new_property'))).toBeInTheDocument();
			expect(screen.getByText(i18n.t('tab_title_missing_properties'))).toBeInTheDocument();
		});

		const rows = screen.getByRole('row').elements();
		const cells = screen.getByRole('cell').elements();
		const propertiesKeys = Object.keys(node.properties);

		expect(rows.length).toBe(propertiesKeys.length);
		expect(cells.length).toBe(propertiesKeys.length * 3);

		for (let i = 0, l = propertiesKeys.length; i < l; i++) {
			expect(cells[i * 3].textContent).toBe(idFormatter.parseIdToName(propertiesKeys[i]));
			expect(cells[i * 3 + 1].querySelector('textarea')?.textContent).toBe(
				node.properties[propertiesKeys[i]].value
			);
			expect(cells[i * 3 + 2].querySelector('button')).toBeInTheDocument();
		}
	});
});
