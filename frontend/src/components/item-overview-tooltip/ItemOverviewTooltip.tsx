import clsx from 'clsx';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ItemInfo } from 'src/components/item-info/ItemInfo';
import { ItemOverviewButton } from 'src/components/item-overview-button/ItemOverviewButton';
import { Table } from 'src/components/table/Table';
import { TableBody } from 'src/components/table-body/TableBody';
import { TableCell } from 'src/components/table-cell/TableCell';
import { TableHead } from 'src/components/table-head/TableHead';
import { TableRow } from 'src/components/table-row/TableRow';
import { Tooltip } from 'src/components/tooltip/Tooltip';
import { isString } from 'src/utils/helpers/general';
import { isNode } from 'src/utils/helpers/nodes';
import { isRelation } from 'src/utils/helpers/relations';
import { RenderContent } from 'src/utils/helpers/search';
import { ItemOverviewTooltipProps } from './ItemOverviewTooltip.interfaces';
import './ItemOverviewTooltip.scss';
import { useEffect, useRef, useState } from 'react';
import { ItemPropertiesHandle } from '../item-properties/ItemProperties.interfaces';
import { ItemOverviewTag } from '../item-overview-tag/ItemOverviewTag';
import { MenuButton } from '../menu-button/MenuButton';
import { DBAccordion, DBAccordionItem, DBButton, DBIcon, DBNotification, DBSection, DBTooltip } from '@db-ux/react-core-components';
import { nodesApi } from 'src/utils/api/nodes';
import { CopyToClipboard } from '../copy-to-clipboard/CopyToClipboard';
import { useDrawerStore } from 'src/stores/drawer';
import { useItemsDrawerContext } from '../items-drawer/context/ItemsDrawerContext';
import { EditSaveBlock } from '../edit-save-block/EditSaveBlock';
import { MetaForMeta, Node } from 'src/models/node';
import { useItemsStore } from 'src/stores/items';
import { useNotificationsStore } from 'src/stores/notifications';
import { metaForMetaApi } from 'src/utils/api/metaForMeta';
import { GraphEditorType } from 'src/utils/constants';
import { relationsApi } from 'src/utils/api/relations';

/**
 * This component renders the content of each item, coming from ItemInfo or ItemOverviewButton component.
 * It gives the user an overview of details to the corresponding item.
 *
 */
export const ItemOverviewTooltip = ({
	item,
	tooltipRef,
	tooltipOffset,
	id,
	className,
	testId
}: ItemOverviewTooltipProps) => {
	const { t } = useTranslation();
	const rootElementClassName = clsx('item-overview-tooltip db-bg-color-lvl-1', className);
	const nodePropertiesHandleRef = useRef<ItemPropertiesHandle>(null);
	const { setEntry, addEntry } = useDrawerStore((store) => store);
	const { isInsideItemsDrawer } = useItemsDrawerContext();
	const [isTypeMetaLoading, setIsTypeMetaLoading] = useState(false);
	const [typeMeta, setTypeMeta] = useState<MetaForMeta>({});
	const [isLoadingSourceAndTargetNodes, setIsLoadingSourceAndTargetNodes] = useState(true);
	const [sourceAndTargetNodes, setSourceAndTargetNodes] = useState<Array<Node>>([]);
	const getNodesAsync = useItemsStore((store) => store.getNodesAsync);
	const addNotification = useNotificationsStore((store) => store.addNotification);
	const onClick = () => {
		if (isInsideItemsDrawer) {
			addEntry({ itemId: item.id });
		} else {
			setEntry({ itemId: item.id });
		}
	};
	useEffect(() => {
		(async () => {

			if (isRelation(item)){
			setIsLoadingSourceAndTargetNodes(true);
			const nodes =  await getNodesAsync([item.source_id, item.target_id]);

			getMetaForMeta();

			if (nodes != null && nodes[0] && nodes[1]) {
				setSourceAndTargetNodes(nodes);
			} else {
				addNotification({
					title: t('notifications_failure_relation_fetch'),
					type: 'critical'
				});
			}

			setIsLoadingSourceAndTargetNodes(false);
			}

		})();
	}, [item]);

	const getMetaForMeta = () => {
			setIsTypeMetaLoading(true);
	
			metaForMetaApi
				.postMetaForMeta({
					ids: [isRelation(item) ? item.type : ''],
					resultType: GraphEditorType.META_PROPERTY
				})
				.then((data) => {
					setTypeMeta(data.data.nodes);
				})
				.finally(() => {
					setIsTypeMetaLoading(false);
				});
		};
	const isCurrentNode = isNode(item);



	return createPortal(
		<dialog id={id} open={true} className={rootElementClassName} data-testid={testId}>
			<Tooltip
				className="item-info__item-overview-tooltip--tooltip"
				tooltipTargetRef={tooltipRef}
				placement="top"
				showArrow={true}
				animation={false}
				isOpen={true}
				offset={tooltipOffset}
				aria-hidden={false}
			>
				<div className="item-info__item-overview-tooltip">
					<div className="item-info__item-overview-tooltip-title-box">
						<div className="item-info__item-overview-tooltip-title">
						<DBIcon icon={isCurrentNode ? 'box' : 'relation'} />
						<h6 className="single-item__title-title">
							{item.title}{' '}
						</h6>

						<MenuButton
							optionsPlacement="bottom-start"
							buttonSize="small"
							options={[
								{
									title: isNode(item) ? t('single-node-delete-item-button') : t('single-relation-delete-item-button'),
									onClick: () => isNode(item) ? nodesApi.deleteNodesAndUpdateApplication([item.id]) : relationsApi.deleteRelationsAndUpdateApplication([item.id]),
									icon: 'bin'
								}
							]}
						/>
						</div>
						<DBButton size='small' variant="ghost" onClick={onClick}>Öffnen</DBButton>
					</div>
					<div className="item-info__item-overview-tooltip-title-id">
						<p>ID:</p>
						<p className="single-item__header-content db-headline-size-xs ">{item.id}</p>
						<CopyToClipboard text={item.id} />
					</div>
					<DBAccordion variant="card" behavior="multiple" initOpenIndex={[0, 1, 2, 3]}>

					<EditSaveBlock
						isEditable={false}
						isEditMode={false}
						variant='small'
						headline={t('single_view_description')} 
						onEditClick={function (): void {throw new Error('Function not implemented.');}} 
						onSaveClick={function (): void {throw new Error('Function not implemented.');}} 
						onUndoClick={function (): void {throw new Error('Function not implemented.');}}	
					>
					{item.description.length>0 && (<div className='db-font-size-sm'>{item.description}</div>) || (<div className='db-font-size-xs'>{t('item_overview_tooltip_no_description')}</div>)}
					</EditSaveBlock>

					{isRelation(item) ? (<EditSaveBlock
						isEditable={false}
						isEditMode={false}
						variant='small'
						onEditClick={function (): void {throw new Error('Function not implemented.');}} 
						onSaveClick={function (): void {throw new Error('Function not implemented.');}} 
						onUndoClick={function (): void {throw new Error('Function not implemented.');}}	
						headline={t('item_overview_tooltip_relation')}>
						
						{isLoadingSourceAndTargetNodes === false && (
						<DBSection spacing="none" className="single-relation__relation">
							{sourceAndTargetNodes.length === 2 ? (
								<>
									<ItemInfo item={sourceAndTargetNodes[0]} />
									<DBIcon
										icon="arrow_right"
										className="single-relation__arrow-icon"
									/>
									<ItemInfo item={sourceAndTargetNodes[1]} />
								</>
							) : (
								<DBNotification
									semantic="critical"
									headline={t('single-relation-failure-notification-headline')}
								>
									{t('single-relation-failure-notification-content')}
								</DBNotification>
							)}
						</DBSection>
					)}
						
						</EditSaveBlock>
							): ''
					}

					<EditSaveBlock
						isEditable={false}
						isEditMode={false}
						variant='small'
						onEditClick={function (): void {throw new Error('Function not implemented.');}} 
						onSaveClick={function (): void {throw new Error('Function not implemented.');}} 
						onUndoClick={function (): void {throw new Error('Function not implemented.');}}	
						headline={isCurrentNode ? t('item_overview_tooltip_labels') : t('item_overview_tooltip_type')}>

							{isCurrentNode ?
								item.labels.length == 0 ? <div>{t('item_overview_tooltip_no_labels')}</div> :
								item.labels.map((label, index) => {
									return (

										<ItemOverviewTag key={index.toString()} nodeId={label} />
									);
								}) :
								isRelation(item) ? <ItemOverviewTag nodeId={item.type} /> : ''
							}
					</EditSaveBlock>

					<EditSaveBlock
						isEditable={false}
						isEditMode={false}
						variant='small'
						onEditClick={function (): void {throw new Error('Function not implemented.');}} 
						onSaveClick={function (): void {throw new Error('Function not implemented.');}} 
						onUndoClick={function (): void {throw new Error('Function not implemented.');}}	
						headline={t('item_overview_tooltip_property_title')}>{
							
							Object.keys(item.properties).length != 0 && (
								<div>
									<Table>
										<TableHead>
											<TableRow>
												<TableCell>{t('form_property_key')}</TableCell>
												<TableCell width='full'>{t('form_property_value')}</TableCell>
												<TableCell>{t('form_property_type')}</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{Object.keys(item.properties).map((property, index) => {
												const content = item.properties[property].value;
												const isContentString = isString(content);

												return (
													<TableRow key={index}>
														<TableCell>
															<ItemOverviewButton nodeId={property} className='db-headline-size-xs'/>
														</TableCell>
														<TableCell>
															<RenderContent
																content={content}
																applyMarkdown={isContentString}
															/>
														</TableCell>
														<TableCell>{item.properties[property].type}</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>						</div>
							) ||(<div>{t('item_overview_tooltip_no_properties')}</div>) }
					</EditSaveBlock>
					</DBAccordion>

				</div>
			</Tooltip>
		</dialog>,
		document.body
	);
};
