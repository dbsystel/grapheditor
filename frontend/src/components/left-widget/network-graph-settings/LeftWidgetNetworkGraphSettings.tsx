import { NetworkGraphFontSize } from 'src/components/network-graph/modules/font-size/NetworkGraphFontSize';
import { NetworkGraphZoomFactor } from 'src/components/network-graph/modules/zoom-factor/NetworkGraphZoomFactor';

export const LeftWidgetNetworkGraphSettings = () => {
	return (
		<>
			<NetworkGraphZoomFactor />
			<NetworkGraphFontSize />
		</>
	);
};
