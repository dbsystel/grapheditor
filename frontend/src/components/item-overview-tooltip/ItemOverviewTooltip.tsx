import './ItemOverviewTooltip.scss';
import clsx from 'clsx';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import Markdown from 'react-markdown';
import { ItemInfo } from 'src/components/item-info/ItemInfo';
import { ItemOverviewButton } from 'src/components/item-overview-button/ItemOverviewButton';
import { Table } from 'src/components/table/Table';
import { TableBody } from 'src/components/table-body/TableBody';
import { TableCell } from 'src/components/table-cell/TableCell';
import { TableHead } from 'src/components/table-head/TableHead';
import { TableRow } from 'src/components/table-row/TableRow';
import { Tooltip } from 'src/components/tooltip/Tooltip';
import { getItemDBId } from 'src/utils/helpers/items';
import { isNode } from 'src/utils/helpers/nodes';
import { isRelation } from 'src/utils/helpers/relations';
import { RenderContent } from 'src/utils/helpers/search';
import { ItemOverviewTooltipProps } from './ItemOverviewTooltip.interfaces';
import { isString } from 'src/utils/helpers/general';

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
					<h4>
						{isNode(item)
							? t('title_node_single_view')
							: t('title_relation_single_view')}
					</h4>
					<div className="item-info__item-overview-tooltip-description">
						<Markdown>{item.description}</Markdown>
					</div>
					<h6 className="item-info__item-overview-tooltip_p">
						{t('single_view_title')}:{' '}
						{<ItemInfo item={item} showTooltipOnHover={false} />}
					</h6>

					<h6>
						ID:{' '}
						<span className="item-info__item-overview-tooltip--normal">
							{getItemDBId(item)}
						</span>
					</h6>

					{/*
					 * If item is a node, then render corresponding labels
					 */}
					{isNode(item) && (
						<div className="item-info__item-overview-tooltip-labels">
							<h6>{t('itemOverviewTooltip_labels')}:</h6>
							<div className="item-info__item-overview-tooltip-label-names">
								{item.labels.length === 0 && (
									<div>{t('itemOverviewTooltip_no_labels')}</div>
								)}
								{item.labels.map((label, index) => {
									return (
										<ItemOverviewButton key={index.toString()} nodeId={label} />
									);
								})}
							</div>
						</div>
					)}

					{/*
					 * If item is a relation then render corresponding type
					 */}
					{isRelation(item) && (
						<div className="item-info__item-overview-tooltip-type">
							<h6>
								{t('itemOverviewTooltip_type')}:{' '}
								<ItemOverviewButton nodeId={item.type} />
							</h6>
						</div>
					)}
				</div>

				<div>
					<h6>{t('itemOverviewTooltip_property_title')}:</h6>
					{Object.keys(item.properties).length === 0 && (
						<div>{t('itemOverviewTooltip_no_properties')}</div>
					)}

					{Object.keys(item.properties).length != 0 && (
						<Table>
							<TableHead>
								<TableRow>
									<TableCell>{t('form_property_key')}</TableCell>
									<TableCell>{t('form_property_value')}</TableCell>
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
												<ItemOverviewButton nodeId={property} />
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
						</Table>
					)}
				</div>
			</Tooltip>
		</dialog>,
		document.body
	);
};
