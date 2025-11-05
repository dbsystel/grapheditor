import './ParallaxNextSteps.scss';
import { DBButton, DBIcon, DBSection } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loading } from 'src/components/loading/Loading';
import { ParallaxRelations } from 'src/components/parallax-relations/ParallaxRelations';
import { Node, NodeId } from 'src/models/node';
import { RelationType } from 'src/models/relation';
import { ParallaxHistory, useParallaxStore } from 'src/stores/parallax';
import { parallaxApi } from 'src/utils/api/parallax';
import { usePostNodesBulkFetch } from 'src/utils/hooks/usePostNodesBulkFetch';
import { ParallaxNextStepsProps } from './ParallaxNextSteps.interfaces';

export const ParallaxNextSteps = ({ id, className, testId }: ParallaxNextStepsProps) => {
	const { t } = useTranslation();
	const parallaxData = useParallaxStore((store) => store.parallaxData);
	const parallaxHistory = useParallaxStore((store) => store.history);
	const parallaxCurrentHistoryIndex = useParallaxStore((store) => store.currentHistoryIndex);
	const parallaxIsLoading = useParallaxStore((store) => store.isLoading);
	const [nextStepRelations, setNextStepRelations] = useState<{
		incomingRelationTypes: Array<RelationType>;
		outgoingRelationTypes: Array<RelationType>;
	}>({
		incomingRelationTypes: [],
		outgoingRelationTypes: []
	});
	const [selectedNextRelations, setSelectedNextRelations] = useState<{
		incomingRelationTypes: Array<RelationType>;
		outgoingRelationTypes: Array<RelationType>;
	}>({ incomingRelationTypes: [], outgoingRelationTypes: [] });
	const [relationsTypeNodes, setRelationsTypeNodes] = useState<Map<NodeId, Node>>(new Map());
	const historyRef = useRef<Array<ParallaxHistory>>([]);
	const relationTypesRef = useRef<{ incoming: Array<NodeId>; outgoing: Array<NodeId> }>({
		incoming: [],
		outgoing: []
	});
	const rootElementClassName = clsx('parallax-next-steps', className);

	const { reFetch, isLoading: isRelationTypesLoading } = usePostNodesBulkFetch({
		executeImmediately: false,
		onSuccess: (nodes) => {
			setRelationsTypeNodes(
				nodes.reduce<Map<NodeId, Node>>((previousValue, currentValue) => {
					previousValue.set(currentValue.id, currentValue);

					return previousValue;
				}, new Map())
			);
		},
		onError: () => {},
		nodeIds: []
	});

	useMemo(() => {
		relationTypesRef.current.incoming = Object.keys(parallaxData?.incomingRelationTypes || []);
		relationTypesRef.current.outgoing = Object.keys(parallaxData?.outgoingRelationTypes || []);

		const relationTypes = [
			...new Set([...relationTypesRef.current.incoming, ...relationTypesRef.current.outgoing])
		];

		if (relationTypes.length) {
			reFetch({ nodeIds: relationTypes });
		}
	}, [parallaxData]);

	useEffect(() => {
		// parallax history doesn't contain data between steps, only "real" history entries
		const nextStepParallaxHistory = parallaxHistory.at(parallaxCurrentHistoryIndex + 1);

		setNextStepRelations({
			incomingRelationTypes: relationTypesRef.current.incoming,
			outgoingRelationTypes: relationTypesRef.current.outgoing
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

			useParallaxStore.getState().setApiTriggerType('next-steps');
			parallaxApi.triggerNextSteps(historyRef.current);

			setSelectedNextRelations({
				incomingRelationTypes: [],
				outgoingRelationTypes: []
			});
		}
	};

	const title = t('parallax_next_steps_title');
	const showButtonTitle = t('parallax_next_steps_show_button_title');
	const noParallaxDataMessage = t('parallax_next_steps_no_parallax_data_message');
	const numberOfSelectedRelationsType =
		selectedNextRelations.incomingRelationTypes.length +
		selectedNextRelations.outgoingRelationTypes.length;

	return (
		<Loading
			isLoading={parallaxIsLoading || isRelationTypesLoading}
			renderChildrenWhileLoading={true}
		>
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
							relationsTypeNodes={relationsTypeNodes}
							onRelationChange={handleRelationChange}
							selectedRelations={selectedNextRelations}
						/>

						<DBButton
							variant="brand"
							onClick={nextParallaxStep}
							disabled={
								parallaxIsLoading ||
								isRelationTypesLoading ||
								!parallaxData ||
								numberOfSelectedRelationsType === 0
							}
						>
							{showButtonTitle}
						</DBButton>
					</div>
				)}
			</DBSection>
		</Loading>
	);
};
