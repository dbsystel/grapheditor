import { useContextMenuStore } from 'src/stores/context-menu';
import { useGraphStore } from 'src/stores/graph';

export const showAllAction = () => {
	useGraphStore
		.getState()
		.sigma.getGraph()
		.updateEachNodeAttributes((node, attributes) => {
			return {
				...attributes,
				hidden: false
			};
		});

	useGraphStore
		.getState()
		.sigma.getGraph()
		.updateEachEdgeAttributes((edge, attributes) => {
			return {
				...attributes,
				hidden: false
			};
		});

	useContextMenuStore.getState().close();
};
