import './RightWidget.scss';
import clsx from 'clsx';
import { ErrorBoundary } from 'src/components/error-boundary/ErrorBoundary';
import { ItemsDrawer } from 'src/components/items-drawer/ItemsDrawer';
import { ParallaxNextSteps } from 'src/components/parallax-next-steps/ParallaxNextSteps';
import { Sidebar } from 'src/components/sidebar/Sidebar';
import { RightWidgetProps } from './RightWidget.interfaces';

export const RightWidget = ({
	shouldRenderNextSteps = true,
	id,
	className,
	testId
}: RightWidgetProps) => {
	const rootElementClassName = clsx('right-widget', className);

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{shouldRenderNextSteps && (
				<Sidebar
					shouldHideCloseButton={true}
					direction="left"
					isHorizontalResizeable={true}
					sidebarId="right-widget-sidebar"
				>
					<ErrorBoundary>
						<ParallaxNextSteps />
					</ErrorBoundary>
				</Sidebar>
			)}
			<ItemsDrawer />
		</div>
	);
};
