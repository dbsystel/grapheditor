import './PerspectiveFinder.scss';
import { DBCustomSelect } from '@db-ux/react-core-components';
import { CustomSelectOptionType } from '@db-ux/react-core-components/dist/components/custom-select/model';
import clsx from 'clsx';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NodeId } from 'src/models/node';
import { useGraphStore } from 'src/stores/graph';
import { isObject } from 'src/utils/helpers/general';
import { processPerspective } from 'src/utils/helpers/nodes';
import { useGetNodesPerspectivesNodes } from 'src/utils/hooks/useGetNodesPerspectivesNodes';
import { useGetPerspective } from 'src/utils/hooks/useGetPerspective';
import { PerspectiveFinderProps } from './PerspectiveFinder.interfaces';

export const PerspectiveFinder = ({ id, className, testId }: PerspectiveFinderProps) => {
	const { t } = useTranslation();
	const rootElementClassName = clsx('action-menu__perspective-finder', className);
	const [perspectiveOptions, setPerspectiveOptions] = useState<Array<CustomSelectOptionType>>([]);
	const perspectiveId = useGraphStore((store) => store.perspectiveId);
	const setPerspectiveId = useGraphStore((store) => store.setPerspectiveId);
	const values = [perspectiveId || ''];

	const { isLoading: isPerspectiveLoading, reFetch: fetchPerspectiveNodes } =
		useGetNodesPerspectivesNodes({
			executeImmediately: false,
			onSuccess: (data) => {
				setPerspectiveOptions(
					data.map((node) => {
						let label = node.title;

						if (node.description) {
							label += ' (' + node.description + ')';
						}

						return {
							label: label,
							value: node.id
						};
					})
				);
			}
		});

	useGetPerspective(
		{
			executeImmediately: !!perspectiveId,
			perspectiveId: perspectiveId || '',
			onSuccess: (response) => processPerspective(response.data)
		},
		[perspectiveId]
	);

	const onPerspectiveChange = (selectedPerspectives: Array<NodeId>) => {
		setPerspectiveId(selectedPerspectives[0]);
	};

	const onDropdownToggle = (event: unknown) => {
		if (isObject(event) && 'newState' in event && event.newState === 'open') {
			fetchPerspectiveNodes();
		}
	};

	return (
		<div className={rootElementClassName} id={id} data-testid={testId}>
			<DBCustomSelect
				options={perspectiveOptions}
				values={values}
				showLabel={false}
				placeholder={t('perspective_finder_placeholder')}
				showSearch={true}
				searchPlaceholder={t('perspective_finder_search_placeholder')}
				loadingText={t('perspective_finder_loading')}
				noResultsText={t('perspective_finder_nothing_found')}
				showIcon={false}
				onDropdownToggle={onDropdownToggle}
				showLoading={isPerspectiveLoading}
				showClearSelection={false}
				onOptionSelected={onPerspectiveChange}
				dropdownWidth="full"
				label=""
			/>
		</div>
	);
};
