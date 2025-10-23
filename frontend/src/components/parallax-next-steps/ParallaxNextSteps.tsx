import './ParallaxNextSteps.scss';
import { DBButton, DBIcon, DBSection } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ParallaxRelations } from 'src/components/parallax-relations/ParallaxRelations';
import { RelationType } from 'src/models/relation';
import { ParallaxHistory, useParallaxStore } from 'src/stores/parallax';
import { useSearchStore } from 'src/stores/search';
import { buildSimpleSearchResult } from 'src/utils/helpers/search';
import { usePostParallax } from 'src/utils/hooks/usePostParallax';
import { ParallaxNextStepsProps } from './ParallaxNextSteps.interfaces';

export const ParallaxNextSteps = ({ id, className, testId }: ParallaxNextStepsProps) => {
	const { t } = useTranslation();
	const parallaxData = useParallaxStore((store) => store.parallaxData);
	const parallaxHistory = useParallaxStore((store) => store.history);
	const parallaxCurrentHistoryIndex = useParallaxStore((store) => store.currentHistoryIndex);
	const setResult = useSearchStore((store) => store.setResult);
	const setParallaxHistory = useParallaxStore((store) => store.setHistory);
	const setParallaxData = useParallaxStore((store) => store.setParallaxData);
	const setParallaxIsLoading = useParallaxStore((store) => store.setIsLoading);
	const setParallaxCurrentHistoryIndex = useParallaxStore(
		(store) => store.setCurrentHistoryIndex
	);
	const [nextStepRelations, setNextStepRelations] = useState<{
		incomingRelationTypes: Array<RelationType>;
		outgoingRelationTypes: Array<RelationType>;
	}>({
		incomingRelationTypes: [],
		outgoingRelationTypes: []
	});
	const [selectedNextRelations, setSelectedNextRelations] = useState<{
		incomingRelationTypes: Array<string>;
		outgoingRelationTypes: Array<string>;
	}>({ incomingRelationTypes: [], outgoingRelationTypes: [] });
	const historyRef = useRef<Array<ParallaxHistory>>([]);
	const rootElementClassName = clsx('parallax-next-steps', className);

	const { reFetch, isLoading } = usePostParallax({
		nodeIds: [],
		filters: {
			labels: [],
			properties: {}
		},
		steps: [],
		onSuccess: (response) => {
			setResult(buildSimpleSearchResult(Object.values(response.data.nodes)), 'parallax');
			setParallaxData(response.data);
			setParallaxHistory(historyRef.current);
			setParallaxCurrentHistoryIndex(historyRef.current.length - 1);
		},
		onFinally: () => {
			setParallaxIsLoading(false);
		}
	});

	useEffect(() => {
		// parallax history doesn't contain data between steps, only "real" history entries
		const nextStepParallaxHistory = parallaxHistory.at(parallaxCurrentHistoryIndex + 1);

		setNextStepRelations({
			incomingRelationTypes: Object.keys(parallaxData?.incomingRelationTypes || []),
			outgoingRelationTypes: Object.keys(parallaxData?.outgoingRelationTypes || [])
		});

		if (nextStepParallaxHistory) {
			setSelectedNextRelations({
				incomingRelationTypes: nextStepParallaxHistory.incomingRelationTypes,
				outgoingRelationTypes: nextStepParallaxHistory.outgoingRelationTypes
			});
		} else {
			setSelectedNextRelations({
				incomingRelationTypes: [],
				outgoingRelationTypes: []
			});
		}
	}, [parallaxData]);

	const handleRelationChange = (
		relationName: string,
		type: 'incomingRelationTypes' | 'outgoingRelationTypes',
		checked: boolean
	) => {
		setSelectedNextRelations((prev) => ({
			...prev,
			[type]: checked
				? [...prev[type], relationName]
				: prev[type].filter((name) => name !== relationName)
		}));
	};

	const nextParallaxStep = () => {
		if (
			selectedNextRelations.incomingRelationTypes.length ||
			selectedNextRelations.outgoingRelationTypes.length
		) {
			const newHistoryEntry: ParallaxHistory = {
				filters: {
					properties: {},
					labels: []
				},
				incomingRelationTypes: selectedNextRelations.incomingRelationTypes,
				outgoingRelationTypes: selectedNextRelations.outgoingRelationTypes
			};

			const currentHistoryIndex = useParallaxStore.getState().currentHistoryIndex;
			const parallaxHistory = useParallaxStore
				.getState()
				.history.slice(0, currentHistoryIndex + 1);

			parallaxHistory.push(newHistoryEntry);
			historyRef.current = parallaxHistory;

			setParallaxIsLoading(true);

			reFetch({
				nodeIds: useParallaxStore.getState().initialQuery.nodeIds,
				filters: useParallaxStore.getState().initialQuery.filters,
				steps: historyRef.current
			});

			setSelectedNextRelations({
				incomingRelationTypes: [],
				outgoingRelationTypes: []
			});
		}
	};

	const title = t('parallax_next_steps_title');
	const showButtonTitle = t('parallax_next_steps_show_button_title');
	const noParallaxDataMessage = t('parallax_next_steps_no_parallax_data_message');

	return (
		<DBSection id={id} className={rootElementClassName} data-testid={testId} spacing="none">
			<h4>{title}</h4>
			{!parallaxData ? (
				<p>
					<DBIcon icon="information_circle" /> {noParallaxDataMessage}
				</p>
			) : (
				<div>
					<ParallaxRelations
						nextStepRelations={nextStepRelations}
						onRelationChange={handleRelationChange}
						selectedRelations={selectedNextRelations}
					/>

					<DBButton
						variant="brand"
						onClick={nextParallaxStep}
						disabled={isLoading || !parallaxData}
					>
						{showButtonTitle}
					</DBButton>
				</div>
			)}
		</DBSection>
	);
};
