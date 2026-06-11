import './LeftWidget.scss';
import { DBAccordion, DBAccordionItem } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from 'src/components/error-boundary/ErrorBoundary';
import { GraphOptions } from 'src/components/graph-options/GraphOptions';
import { LeftWidgetDebug } from 'src/components/left-widget/debug/LeftWidgetDebug';
import { LeftWidgetNetworkGraphSettings } from 'src/components/left-widget/network-graph-settings/LeftWidgetNetworkGraphSettings';
import { LeftWidgetNewItemSettings } from 'src/components/left-widget/new-item-settings/LeftWidgetNewItemSettings';
import { ParallaxFilters } from 'src/components/parallax-filters/ParallaxFilters';
import { Sidebar } from 'src/components/sidebar/Sidebar';
import { LeftWidgetProps } from './LeftWidget.interfaces';

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
						<ErrorBoundary>
							<GraphOptions />
						</ErrorBoundary>
					</DBAccordionItem>
					<DBAccordionItem headline={filtersLabel}>
						<ErrorBoundary>
							<ParallaxFilters />
						</ErrorBoundary>
					</DBAccordionItem>
					<DBAccordionItem headline={newItemSettingsLabel}>
						<ErrorBoundary>
							<LeftWidgetNewItemSettings />
						</ErrorBoundary>
					</DBAccordionItem>
					<DBAccordionItem headline={networkGraphLabel}>
						<ErrorBoundary>
							<LeftWidgetNetworkGraphSettings />
						</ErrorBoundary>
					</DBAccordionItem>
					<DBAccordionItem headline={debugLabel}>
						<ErrorBoundary>
							<LeftWidgetDebug />
						</ErrorBoundary>
					</DBAccordionItem>
				</DBAccordion>
			</Sidebar>
		</div>
	);
};
