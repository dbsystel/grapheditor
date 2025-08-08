import noverlap from 'graphology-layout-noverlap';
import { useGraphStore } from 'src/stores/graph';

/**
 * @see https://graphology.github.io/standard-library/layout-noverlap.html
 */
export const assignNoverlapLayout = () => {
	noverlap.assign(useGraphStore.getState().sigma.getGraph(), {
		maxIterations: 500,
		settings: {
			ratio: 1
		}
	});
};
