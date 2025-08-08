import forceAtlas2 from 'graphology-layout-forceatlas2';
import { useGraphStore } from 'src/stores/graph';

/**
 * @see https://graphology.github.io/standard-library/layout-forceatlas2.html
 */
export const assignForceAtlas2Layout = () => {
	forceAtlas2.assign(useGraphStore.getState().sigma.getGraph(), {
		iterations: 100,
		settings: {
			scalingRatio: 300,
			barnesHutOptimize: true,
			gravity: 25
		}
	});
};
