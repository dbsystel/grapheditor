import random from 'graphology-layout/random.js';
import { useGraphStore } from 'src/stores/graph';

/**
 * @see https://graphology.github.io/standard-library/layout.html#random
 */
export const assignRandomLayout = () => {
	random.assign(useGraphStore.getState().sigma.getGraph(), {
		rng: () => {
			return Math.random() * 1000;
		}
	});
};
