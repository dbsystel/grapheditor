import clsx from 'clsx';
import { NetworkGraphAutoPanSpeed } from 'src/components/network-graph/modules/auto-pan-speed/NetworkGraphAutoPanSpeed';
import { NetworkGraphCoordinatesScale } from 'src/components/network-graph/modules/coordinates-scale/NetworkGraphCoordinatesScale';
import { NetworkGraphFontSize } from 'src/components/network-graph/modules/font-size/NetworkGraphFontSize';
import { NetworkGraphZoomFactor } from 'src/components/network-graph/modules/zoom-factor/NetworkGraphZoomFactor';
import { LeftWidgetNetworkGraphSettingsProps } from './LeftWidgetNetworkGraphSettings.interfaces';

export const LeftWidgetNetworkGraphSettings = ({
	id,
	className,
	testId
}: LeftWidgetNetworkGraphSettingsProps) => {
	const rootElementClassName = clsx('left-widget__network-graph-settings', className);

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<NetworkGraphZoomFactor />
			<NetworkGraphAutoPanSpeed />
			<NetworkGraphFontSize />
			<NetworkGraphCoordinatesScale />
		</div>
	);
};
