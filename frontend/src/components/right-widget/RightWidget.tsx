import './RightWidget.scss';
import { DBButton, DBDrawer, DBSection } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useState } from 'react';
import { ErrorBoundary } from 'src/components/error-boundary/ErrorBoundary';
import { ItemsDrawer } from 'src/components/items-drawer/ItemsDrawer';
import { ParallaxNextSteps } from 'src/components/parallax-next-steps/ParallaxNextSteps';
import { RightWidgetProps } from './RightWidget.interfaces';

export const RightWidget = ({ id, className, testId }: RightWidgetProps) => {
	const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
	const rootElementClassName = clsx('right-widget', className, {
		'right-widget--collapsed': isCollapsed
	});

	const toggleDrawer = () => {
		setIsCollapsed(!isCollapsed);
	};

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<DBDrawer
				id="right-widget__drawer"
				data-testid={testId}
				closeButtonText=""
				backdrop="none"
				open={true}
				direction="right"
				drawerHeader={<DrawerHead toggleDrawer={toggleDrawer} isCollapsed={isCollapsed} />}
				spacing="none"
			>
				<ErrorBoundary>
					<ParallaxNextSteps />
				</ErrorBoundary>
			</DBDrawer>
			<ItemsDrawer id="items-drawer" />
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
		<DBSection spacing="none" className="right-widget__header">
			<DBButton
				icon={isCollapsed ? 'chevron_left' : 'chevron_right'}
				onClick={toggleDrawer}
				variant="ghost"
				noText
			/>
		</DBSection>
	);
};
