import { addNewGraphNode } from 'src/components/network-graph/helpers';
import { useContextMenuStore } from 'src/stores/context-menu';

export const addNodeAction = () => {
	const event = useContextMenuStore.getState().event;

	if (event && 'event' in event) {
		addNewGraphNode(event, useContextMenuStore.getState().close);
	}
};
