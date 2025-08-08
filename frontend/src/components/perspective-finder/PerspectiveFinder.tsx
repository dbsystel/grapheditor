import './PerspectiveFinder.scss';
import { DBCustomSelect } from '@db-ux/react-core-components';
import { CustomSelectOptionType } from '@db-ux/react-core-components/dist/components/custom-select/model';
import clsx from 'clsx';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NodeId } from 'src/models/node';
import { isObject } from 'src/utils/helpers/general';
import { processPerspective } from 'src/utils/helpers/nodes';
import { useGetNodesPerspectivesNodes } from 'src/utils/hooks/useGetNodesPerspectivesNodes';
import { useGetPerspective } from 'src/utils/hooks/useGetPerspective';
import { PerspectiveFinderProps } from './PerspectiveFinder.interfaces';

export const PerspectiveFinder = ({ id, className, testId }: PerspectiveFinderProps) => {
	const { t } = useTranslation();
	const rootElementClassName = clsx('action-menu__perspective-finder', className);
	const [perspectives, setPerspectives] = useState<Array<NodeId>>([]);
	const [perspectiveOptions, setPerspectiveOptions] = useState<Array<CustomSelectOptionType>>([]);
	const [userSelectedPerspectiveId, setUserSelectedPerspectiveId] = useState<string>('');

	const { isLoading: isPerspectiveLoading, reFetch: fetchPerspectiveNodes } =
		useGetNodesPerspectivesNodes({
			executeImmediately: false,
			onSuccess: (data) => {
				setPerspectiveOptions(
					data.map((node) => {
						return {
							label: node.title,
							value: node.id
						};
					})
				);
			}
		});

	useGetPerspective(
		{
			executeImmediately: !!userSelectedPerspectiveId,
			perspectiveId: userSelectedPerspectiveId,
			onSuccess: (response) => processPerspective(response.data)
		},
		[userSelectedPerspectiveId]
	);

	const onPerspectiveChange = (selectedPerspectives: Array<NodeId>) => {
		setPerspectives(selectedPerspectives);
		setUserSelectedPerspectiveId(selectedPerspectives[0]);
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
				values={perspectives}
				label={t('action_menu_perspective_finder_label')}
				showSearch={true}
				showIcon={false}
				noResultsText=""
				onDropdownToggle={onDropdownToggle}
				showLoading={isPerspectiveLoading}
				loadingText="Loading..."
				showClearSelection={false}
				variant="floating"
				onOptionSelected={onPerspectiveChange}
				dropdownWidth="full"
			/>
		</div>
	);
};
