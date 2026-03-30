import './PerspectiveFinder.scss';
import { DBButton, DBCustomSelect } from '@db-ux/react-core-components';
import { CustomSelectOptionType } from '@db-ux/react-core-components/dist/components/custom-select/model';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { NodeId } from 'src/models/node';
import { useSearchStore } from 'src/stores/search';
import {
	GLOBAL_SEARCH_NODE_ID_KEY,
	GLOBAL_SEARCH_TYPE_KEY,
	GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVE
} from 'src/utils/constants';
import { eventBus, EventBusEvents } from 'src/utils/event-bus';
import { goToApplicationView, isHomepageView, isObject } from 'src/utils/helpers/general';
import { processPerspective } from 'src/utils/helpers/nodes';
import { useGetNodesPerspectivesNodes } from 'src/utils/hooks/useGetNodesPerspectivesNodes';
import { useGetPerspective } from 'src/utils/hooks/useGetPerspective';
import { PerspectiveFinderProps } from './PerspectiveFinder.interfaces';

export const PerspectiveFinder = ({ id, className, testId }: PerspectiveFinderProps) => {
	const { t } = useTranslation();
	const rootElementClassName = clsx('perspective-finder', className);
	const [perspectiveOptions, setPerspectiveOptions] = useState<Array<CustomSelectOptionType>>([]);
	const [perspectiveId, setPerspectiveId] = useState('');
	const [searchParams] = useSearchParams();
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
		const onNodesUpdate = (data: EventBusEvents['nodesUpdate']) => {
			const updatedPerspectiveNode = data.nodes.find(
				(updatedNode) => updatedNode.id === perspectiveId
			);

			if (updatedPerspectiveNode) {
				setPerspectiveOptions((prevOptions) => {
					return prevOptions.map((option) => {
						if (option.value === updatedPerspectiveNode.id) {
							return {
								label: updatedPerspectiveNode.title,
								value: option.value
							};
						}

						return option;
					});
				});
			}
		};

		eventBus.subscribe('nodesUpdate', onNodesUpdate);

		return () => {
			eventBus.unsubscribe('nodesUpdate', onNodesUpdate);
		};
	}, [perspectiveId, perspectiveOptions]);

	useEffect(() => {
		const type = useSearchStore.getState().getUrlSearchParameter(GLOBAL_SEARCH_TYPE_KEY);
		const nodeId = useSearchStore.getState().getUrlSearchParameter(GLOBAL_SEARCH_NODE_ID_KEY);

		if (type === GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVE && nodeId) {
			// initialize the component with values from URL
			setPerspectiveId(nodeId);
			fetchPerspectiveNodes();
		}
	}, [searchParams]);

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
