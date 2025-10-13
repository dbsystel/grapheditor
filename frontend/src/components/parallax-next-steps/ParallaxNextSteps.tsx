import { DBButton, DBCheckbox, DBDrawer, DBIcon, DBSection } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from 'src/components/error-boundary/ErrorBoundary';
import { ItemOverviewButton } from 'src/components/item-overview-button/ItemOverviewButton';
import { ParallaxRelationsProps } from 'src/components/right-widget/RightWidget.interfaces';
import { TableBody } from 'src/components/table-body/TableBody';
import { TableCell } from 'src/components/table-cell/TableCell';
import { TableRow } from 'src/components/table-row/TableRow';
import { Table } from 'src/components/table/Table';
import { RelationType } from 'src/models/relation';
import { ParallaxHistory, useParallaxStore } from 'src/stores/parallax';
import { useSearchStore } from 'src/stores/search';
import { buildSimpleSearchResult } from 'src/utils/helpers/search';
import { usePostParallax } from 'src/utils/hooks/usePostParallax';
import { ParallaxNextStepsProps } from './ParallaxNextSteps.interfaces';
import './ParallaxNextSteps.scss';

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
		incomingRelationTypes: string[];
		outgoingRelationTypes: string[];
	}>({ incomingRelationTypes: [], outgoingRelationTypes: [] });
	const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
	const historyRef = useRef<Array<ParallaxHistory>>([]);
	const rootElementClassName = clsx('parallax-next-steps', className, {
		'parallax-next-steps--collapsed': isCollapsed
	});

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
		onError: (error) => {
			console.error('Parallax error:', error);
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

	const toggleDrawer = () => {
		setIsCollapsed(!isCollapsed);
	};

	const title = t('parallax_next_steps_title');
	const showButtonTitle = t('parallax_next_steps_show_button_title');
	const noParallaxDataMessage = t('parallax_next_steps_no_parallax_data_message');

	return (
		<DBDrawer
			id={id}
			className={rootElementClassName}
			data-testid={testId}
			closeButtonText=""
			backdrop="none"
			open={true}
			direction="right"
			drawerHeader={<DrawerHead toggleDrawer={toggleDrawer} isCollapsed={isCollapsed} />}
			spacing="none"
		>
			<ErrorBoundary>
				<DBSection spacing="none">
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
			</ErrorBoundary>
		</DBDrawer>
	);
};

const ParallaxRelations = ({
	nextStepRelations,
	className,
	onRelationChange,
	selectedRelations
}: ParallaxRelationsProps) => {
	return (
		<Table className="parallax-next-steps__table">
			<TableBody className={className}>
				{nextStepRelations.incomingRelationTypes.map((relation, index) => (
					<RelationRow
						key={`incoming-${index}`}
						relationType={relation}
						type="incomingRelationTypes"
						onChange={onRelationChange}
						isSelected={selectedRelations.incomingRelationTypes.includes(relation)}
					/>
				))}

				{nextStepRelations.outgoingRelationTypes.map((relation, index) => (
					<RelationRow
						key={`outgoing-${index}`}
						relationType={relation}
						type="outgoingRelationTypes"
						onChange={onRelationChange}
						isSelected={selectedRelations.outgoingRelationTypes.includes(relation)}
					/>
				))}
			</TableBody>
		</Table>
	);
};

const DrawerHead = ({
	isCollapsed,
	toggleDrawer
}: {
	isCollapsed: boolean;
	toggleDrawer: () => void;
}) => {
	return (
		<DBSection spacing="none" className="parallax-next-steps__header">
			<DBButton
				icon={isCollapsed ? 'chevron_left' : 'chevron_right'}
				onClick={toggleDrawer}
				variant="ghost"
				noText
			/>
		</DBSection>
	);
};

const RelationRow = ({
	relationType,
	type,
	onChange,
	isSelected
}: {
	relationType: RelationType;
	type: 'incomingRelationTypes' | 'outgoingRelationTypes';
	onChange: (
		relationName: string,
		type: 'incomingRelationTypes' | 'outgoingRelationTypes',
		checked: boolean
	) => void;
	isSelected: boolean;
}) => (
	<TableRow className="table-row--hoverable-row">
		<TableCell>
			<DBCheckbox
				onChange={(e) => onChange(relationType, type, e.target.checked)}
				checked={isSelected}
			/>
		</TableCell>

		<TableCell>
			<DBIcon icon="box" />
		</TableCell>

		<TableCell>
			<DBIcon icon={type === 'incomingRelationTypes' ? 'arrow_left' : 'arrow_right'} />
		</TableCell>

		<TableCell>
			<ItemOverviewButton nodeId={relationType} />
		</TableCell>
	</TableRow>
);
