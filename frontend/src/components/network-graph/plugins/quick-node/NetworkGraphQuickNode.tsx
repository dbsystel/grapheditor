import { useEffect } from 'react';
import { addNewGraphNode } from 'src/components/network-graph/helpers';
import { StateManager } from 'src/components/network-graph/state-manager';

export const NetworkGraphQuickNode = () => {
	useEffect(() => {
		StateManager.getInstance().subscribe('nodeQuick', addNewGraphNode);

		return () => {
			StateManager.getInstance().unsubscribe('nodeQuick', addNewGraphNode);
		};
	}, []);

	return null;
};
