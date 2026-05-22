import './PerspectiveFinder.scss';
import { DBButton, DBCustomSelect } from '@db-ux/react-core-components';
import { CustomSelectOptionType } from '@db-ux/react-core-components/dist/components/custom-select/model';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Node, NodeId } from 'src/models/node';
import { Perspective } from 'src/models/perspective';
import { usePerspectiveStore } from 'src/stores/perspective';
import { useSearchStore } from 'src/stores/search';
import {
	GLOBAL_SEARCH_NODE_ID_KEY,
	GLOBAL_SEARCH_TYPE_KEY,
	GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVE
} from 'src/utils/constants';
import { goToApplicationView, isHomepageView, isObject } from 'src/utils/helpers/general';
import { isNode } from 'src/utils/helpers/nodes';
import { processPerspective } from 'src/utils/helpers/perspectives';
import { useGetNodesPerspectivesNodes } from 'src/utils/hooks/useGetNodesPerspectivesNodes';
import { useGetPerspective } from 'src/utils/hooks/useGetPerspective';
import { PerspectiveFinderProps } from './PerspectiveFinder.interfaces';

export const PerspectiveFinder = ({ id, className, testId }: PerspectiveFinderProps) => {
	const { t } = useTranslation();
	const rootElementClassName = clsx('perspective-finder', className);
	const [perspectiveOptions, setPerspectiveOptions] = useState<Array<CustomSelectOptionType>>([]);
	const [perspectiveId, setPerspectiveId] = useState('');
	const perspective = usePerspectiveStore((store) => store.perspective);
	const [searchParams] = useSearchParams();
	const values = [perspectiveId || ''];

	const { isLoading: isPerspectiveLoading, reFetch: fetchPerspectiveNodes } =
		useGetNodesPerspectivesNodes({
			executeImmediately: false,
			onSuccess: (data) => {
				setPerspectiveOptions(data.map((node) => formatOption(node)));
			}
		});

	const { reFetch: refetchPerspective } = useGetPerspective(
		{
			executeImmediately: !!perspectiveId,
			perspectiveId: perspectiveId || '',
			onSuccess: (response) => {
				processPerspective(response.data);
			}
		},
		[perspectiveId]
	);

	useEffect(() => {
		if (perspective) {
			setPerspectiveOptions((prevOptions) => {
				return prevOptions.map((option) => {
					if (option.value === perspective.id) {
						return formatOption(perspective);
					}

					return option;
				});
			});
		}
	}, [perspective]);

	useEffect(() => {
		const type = useSearchStore.getState().getUrlSearchParameter(GLOBAL_SEARCH_TYPE_KEY);
		const nodeId = useSearchStore.getState().getUrlSearchParameter(GLOBAL_SEARCH_NODE_ID_KEY);

		if (type === GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVE && nodeId) {
			// initialize the component with values from URL
			setPerspectiveId(nodeId);
			fetchPerspectiveNodes();
		}
	}, [searchParams]);

	const formatOption = (nodeOrPerspective: Node | Perspective) => {
		let label = isNode(nodeOrPerspective) ? nodeOrPerspective.title : nodeOrPerspective.name;

		if (nodeOrPerspective.description) {
			label += ' (' + nodeOrPerspective.description + ')';
		}

		return {
			label: label,
			value: nodeOrPerspective.id
		};
	};

	const onPerspectiveChange = (selectedPerspectives: Array<NodeId>) => {
		const perspectiveId = selectedPerspectives[0];

		if (isHomepageView()) {
			goToApplicationView();
		}

		setPerspectiveId(perspectiveId);
	};

	const onDropdownToggle = (event: unknown) => {
		if (isObject(event) && 'newState' in event && event.newState === 'open') {
			fetchPerspectiveNodes();
		}
	};

	const onRefreshClick = () => {
		if (perspectiveId) {
			refetchPerspective();
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
			<DBButton
				icon="circular_arrows"
				noText
				variant="ghost"
				onClick={onRefreshClick}
				disabled={!perspectiveId}
			/>
		</div>
	);
};
