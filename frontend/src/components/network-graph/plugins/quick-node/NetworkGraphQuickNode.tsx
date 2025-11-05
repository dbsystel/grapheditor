import { useEffect } from 'react';
import { addNewGraphNode } from 'src/components/network-graph/helpers';
import { StateManager } from 'src/components/network-graph/state-manager';

export const NetworkGraphQuickNode = () => {
	useEffect(() => {
		StateManager.getInstance().on('NODE_QUICK', addNewGraphNode);

		return () => {
			StateManager.getInstance().off('NODE_QUICK', addNewGraphNode);
		};
	}, []);

	return null;
};
