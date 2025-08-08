import './AddRelationForm.scss';
import { DBButton, DBIcon, DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ItemFinder } from 'src/components/item-finder/ItemFinder';
import { RelationTypeItemFinder } from 'src/components/relation-type-item-finder/RelationTypeItemFinder';
import { Node } from 'src/models/node';
import { RelationType } from 'src/models/relation';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';
import { useNotificationsStore } from 'src/stores/notifications';
import { getNodes } from 'src/utils/fetch/getNodes';
import { postRelation } from 'src/utils/fetch/postRelation';
import { AddRelationFormProps } from './AddRelationForm.interfaces';

export const AddRelationForm = ({
	id,
	className,
	testId,
	refNode,
	onSave
}: AddRelationFormProps) => {
	const [fromNodes, setFromNodes] = useState<Array<Node>>([]);
	const [toNodes, setToNodes] = useState<Array<Node>>([]);
	const { t } = useTranslation();
	const { addNotification } = useNotificationsStore((state) => state);
	const {
		addRelation: addGraphRelation,
		indexParallelRelations,
		adaptRelationTypeAndCurvature,
		addNode: addGraphNode
	} = useGraphStore((store) => store);
	const setRelation = useItemsStore((store) => store.setRelation);
	const getNodeAsync = useItemsStore((store) => store.getNodeAsync);
	const [isSourceNodeDisabled, setIsSourceNodeDisabled] = useState<boolean>(true);
	const form = useForm<{
		sourceNode: Node | null;
		targetNode: Node | null;
		type: RelationType | null;
	}>({
		defaultValues: {
			sourceNode: refNode,
			targetNode: null,
			type: null
		}
	});
	const rootElementClassName = clsx('add-relation-form', className);

	const {
		control,
		trigger,
		setValue,
		getValues,
		formState: { errors },
		resetField
	} = form;

	// observe node changes, and update the form
	useEffect(() => {
		const formValues = form.getValues();

		if (formValues.sourceNode?.id === refNode.id) {
			setValue('sourceNode', refNode);
		} else if (formValues.targetNode?.id === refNode.id) {
			setValue('targetNode', refNode);
		}
	}, [refNode]);

	const fetchNodes = (type: 'from' | 'to', searchTerm: string) => {
		getNodes({ searchTerm: searchTerm }).then((data) => {
			if (type === 'from') {
				setFromNodes(data.data);
			} else if (type === 'to') {
				setToNodes(data.data);
			}
		});
	};

	const onNodeItemClick = (type: 'from' | 'to', item: Node) => {
		setValue(type == 'from' ? 'sourceNode' : 'targetNode', item);
		trigger(type == 'from' ? 'sourceNode' : 'targetNode');
	};

	const switchNodes = () => {
		const sourceNode = getValues('sourceNode');
		const targetNode = getValues('targetNode');

		setValue('sourceNode', targetNode);
		setValue('targetNode', sourceNode);

		setIsSourceNodeDisabled(!isSourceNodeDisabled);
	};

	const save = async () => {
		const validationSuccessful = await trigger();
		const sourceNodeId = getValues('sourceNode')?.id;
		const targetNodeId = getValues('targetNode')?.id;
		const type = getValues('type');

		if (validationSuccessful && sourceNodeId && targetNodeId && type) {
			postRelation({
				properties: {},
				sourceId: sourceNodeId,
				targetId: targetNodeId,
				type: type
			}).then(async (data) => {
				const relation = data.data;
				const sourceNode = await getNodeAsync(relation.source_id, true);
				const targetNode = await getNodeAsync(relation.target_id, true);

				if (onSave) {
					onSave(sourceNode, targetNode, relation);
				}

				addGraphNode(sourceNode);
				addGraphNode(targetNode);
				setRelation(relation, true);
				addGraphRelation(relation);
				indexParallelRelations();
				adaptRelationTypeAndCurvature(relation.id);

				if (isSourceNodeDisabled) {
					resetField('targetNode');
				} else {
					resetField('sourceNode');
				}

				addNotification({
					title: t('notifications_success_relation_create'),
					type: 'successful'
				});

				useContextMenuStore.getState().close();
			});
		}
	};

	const onRelationTypeChange = (type: Node) => {
		setValue('type', type.id);
	};

	const validationRules = {
		required: t('validation_required')
	};

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<DBIcon icon="box" className="add-relation-form__icon-button-column" />

			<Controller
				control={control}
				name="sourceNode"
				rules={validationRules}
				render={() => {
					return (
						<ItemFinder
							label={t('create_relation_source_node')}
							inputValue={getValues('sourceNode')?.title || ''}
							options={fromNodes}
							onInput={(searchTerm) => {
								fetchNodes('from', searchTerm);
							}}
							value={getValues('sourceNode') || null}
							onChange={(item) => onNodeItemClick('from', item)}
							semantic={errors?.sourceNode ? 'critical' : 'adaptive'}
							invalidMessage={errors?.sourceNode?.message}
							validMessage=""
							isDisabled={isSourceNodeDisabled}
						/>
					);
				}}
			/>

			<DBButton
				onClick={switchNodes}
				type="button"
				icon="arrows_vertical"
				variant="ghost"
				size="medium"
				noText
				className="add-relation-form__change-direction-button add-relation-form__icon-button-column"
			>
				<DBTooltip showArrow={false}>{t('add_relation_form_change_direction')}</DBTooltip>
			</DBButton>

			<Controller
				control={control}
				name="type"
				rules={validationRules}
				render={() => {
					return (
						<RelationTypeItemFinder
							label={t('create_relation_connection')}
							onChange={onRelationTypeChange}
							semantic={errors?.type ? 'critical' : 'adaptive'}
							invalidMessage={errors?.type?.message}
						/>
					);
				}}
			/>

			<DBIcon icon="box" className="add-relation-form__icon-button-column" />

			<Controller
				control={control}
				name="targetNode"
				rules={validationRules}
				render={() => {
					return (
						<ItemFinder
							label={t('create_relation_target_node')}
							inputValue={getValues('targetNode')?.title || ''}
							options={toNodes}
							onInput={(searchTerm) => {
								fetchNodes('to', searchTerm);
							}}
							onChange={(item) => onNodeItemClick('to', item)}
							value={getValues('targetNode') || null}
							semantic={errors?.targetNode ? 'critical' : 'adaptive'}
							invalidMessage={errors?.targetNode?.message}
							validMessage=""
							isDisabled={!isSourceNodeDisabled}
						/>
					);
				}}
			/>

			<DBButton
				className="add-relation-form__save-button"
				onClick={save}
				size="small"
				type="submit"
				variant="filled"
			>
				{t('form_add_button')}
			</DBButton>
		</div>
	);
};
