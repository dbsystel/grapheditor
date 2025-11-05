import './LeftWidget.scss';
import {
	DBAccordion,
	DBAccordionItem,
	DBButton,
	DBDrawer,
	DBSection
} from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LeftWidgetNetworkGraphSettings } from 'src/components/left-widget/network-graph-settings/LeftWidgetNetworkGraphSettings';
import { LeftWidgetNewItemSettings } from 'src/components/left-widget/new-item-settings/LeftWidgetNewItemSettings';
import { ParallaxFilters } from 'src/components/parallax-filters/ParallaxFilters';
import { LeftWidgetProps } from './LeftWidget.interfaces';
import { LeftWidgetPresentation } from './presentation/LeftWidgetPresentation';

export const LeftWidget = ({ id, className, testId }: LeftWidgetProps) => {
	const { t } = useTranslation();
	const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
	const rootElementClassName = clsx('left-widget', className, {
		'left-widget--collapsed': isCollapsed
	});

	const toggleDrawer = () => {
		setIsCollapsed(!isCollapsed);
	};

	const presentationLabel = t('left_widget_presentation_accordion_label');
	const filtersLabel = t('left_widget_filters_accordion_label');
	const newItemSettingsLabel = t('left_widget_new_item_settings_accordion_label');
	const networkGraphLabel = t('left_widget_network_graph_settings_accordion_label');

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<DBDrawer
				closeButtonText=""
				backdrop="none"
				open={true}
				direction="left"
				drawerHeader={<DrawerHead toggleDrawer={toggleDrawer} isCollapsed={isCollapsed} />}
				spacing="none"
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
				</DBAccordion>
			</DBDrawer>
		</div>
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
		<DBSection spacing="none" className="items-drawer__header">
			<DBButton
				icon={isCollapsed ? 'chevron_right' : 'chevron_left'}
				onClick={toggleDrawer}
				variant="ghost"
				noText
			/>
		</DBSection>
	);
};
