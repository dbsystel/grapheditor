import { useEffect } from 'react';
import { WheelCoords } from 'sigma/types';
import { calculateNodeGraphSize } from 'src/components/network-graph/helpers';
import { StateManager } from 'src/components/network-graph/state-manager';
import { useGraphStore } from 'src/stores/graph';

export const NetworkGraphScaleNodes = () => {
	const sigma = useGraphStore((store) => store.sigma);
	const getNodeSizeFactor = useGraphStore((store) => store.getNodeSizeFactor);
	const setNodeSizeFactor = useGraphStore((store) => store.setNodeSizeFactor);

	useEffect(() => {
		StateManager.getInstance().subscribe('scaleNodes', onScaleNodes);

		return () => {
			StateManager.getInstance().unsubscribe('scaleNodes', onScaleNodes);
		};
	}, []);

	const onScaleNodes = (event: WheelCoords) => {
		if (event.delta > 0 || event.delta < 0) {
			sigma.getCamera().disable();

			// scroll up / zoom in
			if (event.delta > 0) {
				setNodeSizeFactor(getNodeSizeFactor() + 0.1);
			}
			// scroll down / zoom out
			else {
				setNodeSizeFactor(getNodeSizeFactor() - 0.1);
			}

			resizeNodes();

			sigma.once('afterRender', () => {
				sigma.getCamera().enable();
				StateManager.getInstance().resetState();
			});
		}
	};

	const resizeNodes = () => {
		sigma.getGraph().forEachNode((nodeId, attributes) => {
			if (attributes.data) {
				sigma
					.getGraph()
					.setNodeAttribute(
						nodeId,
						'size',
						calculateNodeGraphSize(parseFloat(attributes.data.style.diameter))
					);
			}
		});
	};

	return null;
};
