import './HeaderGraphOptions.scss';
import { DBSelect } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useGraphStore } from 'src/stores/graph';
import { useNotificationsStore } from 'src/stores/notifications';
import { LayoutModuleType, useSearchStore } from 'src/stores/search';
import {
	GLOBAL_SEARCH_ALGORITHM_KEY,
	GLOBAL_SEARCH_PRESENTATION_KEY,
	GRAPH_LAYOUT_FORCE,
	GRAPH_LAYOUT_FORCE_ATLAS_2,
	GRAPH_LAYOUT_NONE,
	GRAPH_LAYOUT_NOVERLAP,
	GRAPH_LAYOUT_PERSPECTIVE,
	GRAPH_LAYOUT_RANDOM,
	GRAPH_PRESENTATION_GRAPH,
	GRAPH_PRESENTATION_OBJECT_TABLE,
	GRAPH_PRESENTATION_RESULT_TABLE,
	GRAPH_STYLE_DEFAULT_VALUE
} from 'src/utils/constants';
import { getPerspective } from 'src/utils/fetch/getPerspective';
import { processPerspective } from 'src/utils/helpers/nodes';
import { useGetStyleCurrent } from 'src/utils/hooks/useGetStyleCurrent';
import { useGetStyles } from 'src/utils/hooks/useGetStyles';
import { usePostStyleCurrent } from 'src/utils/hooks/usePostStyleCurrent';
import { HeaderGraphOptionsProps } from './HeaderGraphOptions.interfaces';

export const HeaderGraphOptions = ({ id, className, testId }: HeaderGraphOptionsProps) => {
	const { t } = useTranslation();
	const searchStore = useSearchStore((store) => store);
	const addNotification = useNotificationsStore((store) => store.addNotification);
	const { setIsLoading } = useGraphStore((state) => state);
	const [styles, setStyles] = useState<Array<string>>([]);
	const [searchParams, setSearchParams] = useSearchParams();
	const perspectiveName = useGraphStore((store) => store.perspectiveName);
	const perspectiveId = useGraphStore((store) => store.perspectiveId);

	const rootElementClassName = clsx('header-graph-options', className);
	const isPerspectiveAlgorithm = searchStore.algorithm === GRAPH_LAYOUT_PERSPECTIVE;

	useGetStyleCurrent({
		onSuccess: (response) => {
			const style = response.data.filename || GRAPH_STYLE_DEFAULT_VALUE;

			searchStore.setStyle(style);
		},
		onError: (error) => {
			addNotification({
				title: t('notifications_failure_grass_file_download'),
				description: error.message,
				type: 'critical'
			});
		},
		onFinally: () => {
			setIsLoading(false);
		},
		executeImmediately: true
	});

	const { reFetch, isLoading: isPostStyleLoading } = usePostStyleCurrent({
		filename: '',
		onSuccess: async () => {
			addNotification({
				title: t('notifications_success_grass_file_change'),
				type: 'successful'
			});

			if (perspectiveId) {
				getPerspective({ perspectiveId: perspectiveId }).then((response) =>
					processPerspective(response.data)
				);
			} else if (searchStore.executeSearch) {
				searchStore.executeSearch();
			}
		},
		onError: (error) => {
			addNotification({
				title: t('notifications_failure_grass_file_change'),
				description: error.message,
				type: 'critical'
			});
		},
		onFinally: () => {
			setIsLoading(false);
		}
	});

	const { reFetch: reFetchStyles } = useGetStyles({
		onSuccess: (response) => {
			setStyles(response.data.filenames);

			if (searchStore.newlyUploadedStyle) {
				searchStore.setNewlyUploadedStyle('');
			}
		},
		onFinally: () => {
			setIsLoading(false);
		},
		executeImmediately: true,
		waitBeforeReFetch: true
	});

	useEffect(() => {
		if (searchStore.newlyUploadedStyle || searchStore.resetStyles) {
			reFetchStyles();
			searchStore.setResetStyles(false);
		}
	}, [searchStore.newlyUploadedStyle, searchStore.resetStyles]);

	const presentationOptions = [
		{
			label: t('data_presentation_graph'),
			value: GRAPH_PRESENTATION_GRAPH,
			icon: 'share',
			key: GRAPH_PRESENTATION_GRAPH
		},
		{
			label: t('data_presentation_object_table'),
			value: GRAPH_PRESENTATION_OBJECT_TABLE,
			icon: 'list',
			key: GRAPH_PRESENTATION_OBJECT_TABLE
		},
		{
			label: t('data_presentation_result_table'),
			value: GRAPH_PRESENTATION_RESULT_TABLE,
			icon: 'grid',
			key: GRAPH_PRESENTATION_RESULT_TABLE
		}
	];

	const algorithmOptions = [
		{
			label: 'Force Atlas 2',
			value: GRAPH_LAYOUT_FORCE_ATLAS_2,
			key: GRAPH_LAYOUT_FORCE_ATLAS_2
		},
		{
			label: 'Force',
			value: GRAPH_LAYOUT_FORCE,
			key: GRAPH_LAYOUT_FORCE
		},
		{
			label: 'Noverlap',
			value: GRAPH_LAYOUT_NOVERLAP,
			key: GRAPH_LAYOUT_NOVERLAP
		},
		{
			label: 'Random',
			value: GRAPH_LAYOUT_RANDOM,
			key: GRAPH_LAYOUT_RANDOM
		},
		{
			label: 'None',
			value: GRAPH_LAYOUT_NONE,
			key: GRAPH_LAYOUT_NONE
		}
	];

	const styleOptions = [
		{ value: GRAPH_STYLE_DEFAULT_VALUE, key: GRAPH_STYLE_DEFAULT_VALUE },
		...styles.map((filename) => {
			return { value: filename, label: filename, key: filename };
		})
	];

	if (isPerspectiveAlgorithm || perspectiveId) {
		algorithmOptions.push({
			label: `Perspective${perspectiveName ? ': ' + perspectiveName : ''}`,
			value: GRAPH_LAYOUT_PERSPECTIVE,
			key: GRAPH_LAYOUT_PERSPECTIVE
		});
	}

	const onPresentationChange = (event: ChangeEvent<HTMLSelectElement>) => {
		searchStore.setPresentation(event.target.value);
		setUrlParams(GLOBAL_SEARCH_PRESENTATION_KEY, event.target.value);
	};

	const onAlgorithmChange = (event: ChangeEvent<HTMLSelectElement>) => {
		searchStore.setAlgorithm(event.target.value as LayoutModuleType);
		setUrlParams(GLOBAL_SEARCH_ALGORITHM_KEY, event.target.value);
	};

	const onStyleChange = (event: ChangeEvent<HTMLSelectElement>) => {
		const newStyle = event.target.value;

		if (newStyle === GRAPH_STYLE_DEFAULT_VALUE) {
			reFetch({ filename: '' });
			searchStore.setStyle(newStyle);
		} else {
			reFetch({ filename: newStyle });
			searchStore.setStyle(newStyle);
		}

		setIsLoading(true);
	};

	const setUrlParams = (key: string, value: string) => {
		setSearchParams({
			...Object.fromEntries(searchParams),
			[key]: value
		});
	};

	const presentationIcon = presentationOptions.find((option) => {
		return option.value === searchStore.presentation;
	});

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<DBSelect
				className="header-graph-options__presentation-label"
				value={searchStore.presentation}
				label={t('data_presentation_presentation_label')}
				options={presentationOptions}
				onChange={onPresentationChange}
				icon={presentationIcon?.icon}
				variant="floating"
			/>
			<DBSelect
				value={searchStore.algorithm}
				label={t('data_presentation_algorithm_label')}
				options={algorithmOptions}
				onChange={onAlgorithmChange}
				variant="floating"
			/>
			<DBSelect
				value={searchStore.style}
				label={t('data_presentation_file_label')}
				options={styleOptions}
				onChange={onStyleChange}
				variant="floating"
				disabled={isPostStyleLoading}
			/>
		</div>
	);
};
