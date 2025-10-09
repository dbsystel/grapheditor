import './RightWidget.scss';
import clsx from 'clsx';
import { ItemsDrawer } from 'src/components/items-drawer/ItemsDrawer';
import { ParallaxNextSteps } from 'src/components/parallax-next-steps/ParallaxNextSteps';
import { RightWidgetProps } from './RightWidget.interfaces';

export const RightWidget = ({ id, className, testId }: RightWidgetProps) => {
	const rootElementClassName = clsx('right-widget', className);

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<ParallaxNextSteps />
			<ItemsDrawer id="items-drawer" />
		</div>
	);
};
