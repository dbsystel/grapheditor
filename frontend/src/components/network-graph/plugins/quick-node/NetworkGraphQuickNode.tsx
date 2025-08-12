import { useEffect } from 'react';
import { SigmaEventPayload } from 'sigma/types';
import { StateManager } from 'src/components/network-graph/state-manager';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';
import { nodesApi } from 'src/utils/api/nodes';

export const NetworkGraphQuickNode = () => {
	const {
		setIsLoading,
		defaultNodeLabels,
		addNode: addGraphNode,
		sigma
	} = useGraphStore((store) => store);
	const setNode = useItemsStore((store) => store.setNode);

	useEffect(() => {
		StateManager.getInstance().on('NODE_QUICK', onNodeQuick);

		return () => {
			StateManager.getInstance().off('NODE_QUICK', onNodeQuick);
		};
	}, [defaultNodeLabels]);

	const onNodeQuick = async (event: SigmaEventPayload) => {
		setIsLoading(true);

		const nodeCoordinates = sigma.viewportToGraph(event.event);

		nodesApi
			.postNode({
				labels: defaultNodeLabels ? defaultNodeLabels.map((label) => label.id) : [],
				properties: {}
			})
			.then((response) => {
				const updatedNode = {
					...response.data,
					style: {
						...response.data.style,
						x: nodeCoordinates.x.toString(),
						y: nodeCoordinates.y.toString()
					}
				};

				setNode(updatedNode, true);
				addGraphNode(updatedNode);
			})
			.finally(() => {
				setIsLoading(false);
			});
	};

	return null;
};
