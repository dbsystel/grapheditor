import './LeftWidget.scss';
import { DBAccordion, DBAccordionItem } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { LeftWidgetDebug } from 'src/components/left-widget/debug/LeftWidgetDebug';
import { LeftWidgetNetworkGraphSettings } from 'src/components/left-widget/network-graph-settings/LeftWidgetNetworkGraphSettings';
import { LeftWidgetNewItemSettings } from 'src/components/left-widget/new-item-settings/LeftWidgetNewItemSettings';
import { ParallaxFilters } from 'src/components/parallax-filters/ParallaxFilters';
import { Sidebar } from 'src/components/sidebar/Sidebar';
import { LeftWidgetProps } from './LeftWidget.interfaces';
import { LeftWidgetPresentation } from './presentation/LeftWidgetPresentation';

export const LeftWidget = ({ id, className, testId }: LeftWidgetProps) => {
	const { t } = useTranslation();
	const rootElementClassName = clsx('left-widget', className);

	const presentationLabel = t('left_widget_presentation_accordion_label');
	const filtersLabel = t('left_widget_filters_accordion_label');
	const newItemSettingsLabel = t('left_widget_new_item_settings_accordion_label');
	const networkGraphLabel = t('left_widget_network_graph_settings_accordion_label');
	const debugLabel = t('left_widget_debug_label');

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<Sidebar
				shouldHideCloseButton={true}
				isHorizontalResizeable={true}
				sidebarId="left-widget-sidebar"
			>
				<DBAccordion behavior="multiple" initOpenIndex={[0]} variant="card">
					<DBAccordionItem headline={presentationLabel}>
						<LeftWidgetPresentation />
					</DBAccordionItem>
					<DBAccordionItem headline={filtersLabel}>
						<ParallaxFilters />
					</DBAccordionItem>
					<DBAccordionItem headline={newItemSettingsLabel}>
						<LeftWidgetNewItemSettings />
					</DBAccordionItem>
					<DBAccordionItem headline={networkGraphLabel}>
						<LeftWidgetNetworkGraphSettings />
					</DBAccordionItem>
					<DBAccordionItem headline={debugLabel}>
						<LeftWidgetDebug />
					</DBAccordionItem>
				</DBAccordion>
			</Sidebar>
		</div>
	);
};
