import './SingleRelation.scss';
import {
	DBAccordion,
	DBAccordionItem,
	DBDivider,
	DBIcon,
	DBNotification,
	DBSection,
	DBTooltip
} from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CopyToClipboard } from 'src/components/copy-to-clipboard/CopyToClipboard';
import { ErrorBoundary } from 'src/components/error-boundary/ErrorBoundary';
import { ItemInfo } from 'src/components/item-info/ItemInfo';
import { ItemProperties } from 'src/components/item-properties/ItemProperties';
import { Loading } from 'src/components/loading/Loading';
import { MenuButton } from 'src/components/menu-button/MenuButton';
import { RelationTypeChanger } from 'src/components/relation-type-changer/RelationTypeChanger';
import { MetaForMeta, Node } from 'src/models/node';
import { useItemsStore } from 'src/stores/items';
import { useNotificationsStore } from 'src/stores/notifications';
import { metaForMetaApi } from 'src/utils/api/metaForMeta';
import { relationsApi } from 'src/utils/api/relations';
import { GraphEditorType } from 'src/utils/constants';
import { SingleRelationProps } from './SingleRelation.interfaces';

/**
 * This component contains the logic to present a detailed single relation view.
 */
export const SingleRelation = ({ relation, id, className, testId }: SingleRelationProps) => {
	const { t } = useTranslation();
	const [sourceAndTargetNodes, setSourceAndTargetNodes] = useState<Array<Node>>([]);
	const [isLoadingSourceAndTargetNodes, setIsLoadingSourceAndTargetNodes] = useState(true);
	const [isTypeMetaLoading, setIsTypeMetaLoading] = useState(false);
	const [typeMeta, setTypeMeta] = useState<MetaForMeta>({});
	const getNodesAsync = useItemsStore((store) => store.getNodesAsync);
	const addNotification = useNotificationsStore((store) => store.addNotification);
	const rootElementClassName = clsx('single-relation', className);

	useEffect(() => {
		(async () => {
			setIsLoadingSourceAndTargetNodes(true);

			const nodes = await getNodesAsync([relation.source_id, relation.target_id]);

			getMetaForMeta();

			if (nodes[0] && nodes[1]) {
				setSourceAndTargetNodes(nodes);
			} else {
				addNotification({
					title: t('notifications_failure_relation_fetch'),
					type: 'critical'
				});
			}

			setIsLoadingSourceAndTargetNodes(false);
		})();
	}, [relation]);

	const getMetaForMeta = () => {
		setIsTypeMetaLoading(true);

		metaForMetaApi
			.postMetaForMeta({
				ids: [relation.type],
				resultType: GraphEditorType.META_PROPERTY
			})
			.then((data) => {
				setTypeMeta(data.data.nodes);
			})
			.finally(() => {
				setIsTypeMetaLoading(false);
			});
	};

	return (
		<DBSection id={id} className={rootElementClassName} data-testid={testId} spacing="none">
			<div className="single-relation__title">
				<DBIcon icon="relation" />

				<p className="single-relation__title-title">
					{relation.title}
					<DBTooltip placement="bottom-end">
						{t('single-relation-relation')} {relation.title}
					</DBTooltip>
				</p>

				<MenuButton
					optionsPlacement="bottom-start"
					buttonSize="small"
					options={[
						{
							title: t('single-relation-delete-item-button'),
							onClick: () =>
								relationsApi.deleteRelationsAndUpdateApplication([relation.id]),
							icon: 'bin'
						}
					]}
				/>
			</div>

			<div className="single-relation__header">
				<div className="single-relation__header-id">
					<div id={relation.id}>
						<p className="single-relation__header-headline">ID</p>
						<p className="single-relation__header-content">{relation.id}</p>
					</div>

					<CopyToClipboard text={relation.id} />

					<DBTooltip
						id={relation.id}
						placement="bottom-end"
						width="fixed"
						showArrow={false}
					>
						{relation.id}
					</DBTooltip>
				</div>
			</div>

			<DBDivider />

			<DBAccordion behavior="multiple" initOpenIndex={[0, 1, 2, 3]}>
				<DBAccordionItem headline={t('single-relation-relation')}>
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
				</DBAccordionItem>

				<DBAccordionItem headline={t('single_relation_type')}>
					<ErrorBoundary>
						<RelationTypeChanger relation={relation} />
					</ErrorBoundary>
				</DBAccordionItem>

				<DBAccordionItem headline={t('single_view_properties_title')}>
					<ErrorBoundary>
						<Loading
							isLoading={isTypeMetaLoading}
							wrapChildren={false}
							renderChildrenWhileLoading={true}
						>
							<ItemProperties item={relation} metaData={typeMeta} />
						</Loading>
					</ErrorBoundary>
				</DBAccordionItem>
			</DBAccordion>
		</DBSection>
	);
};
