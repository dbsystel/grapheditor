import forceLayout from 'graphology-layout-force';
import { useGraphStore } from 'src/stores/graph';

/**
 * @see https://graphology.github.io/standard-library/layout-force.html
 */
export const assignForceLayout = () => {
	forceLayout.assign(useGraphStore.getState().sigma.getGraph(), {
		maxIterations: 500,
		settings: {
			attraction: 0.0005,
			repulsion: 3,
			gravity: 10,
			inertia: 0.6,
			maxMove: 500
		}
	});
};
