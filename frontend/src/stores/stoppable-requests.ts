import {
	StoppableRequest,
	StoppableRequestId,
	StoppableRequestTag
} from 'src/models/stoppable-request';
import { arrayContainsAllPrimitives } from 'src/utils/helpers/general';
import { create } from 'zustand';

type StoppableRequestsStore = {
	stoppableRequests: Array<StoppableRequest>;
	addStoppableRequest: (stoppableRequest: StoppableRequest) => void;
	removeStoppableRequest: (id: StoppableRequestId) => void;
	getAllStoppableRequestsByTags: (tags: Array<StoppableRequestTag>) => Array<StoppableRequest>;
	reset: () => void;
};

type InitialState = Pick<StoppableRequestsStore, 'stoppableRequests'>;

const getInitialState: () => InitialState = () => {
	return {
		stoppableRequests: []
	};
};

/**
 * Stoppable requests store.
 */
export const useStoppableRequestsStore = create<StoppableRequestsStore>((set, get) => ({
	...getInitialState(),
	addStoppableRequest: (stoppableRequest) => {
		set({ stoppableRequests: [...get().stoppableRequests, stoppableRequest] });
	},
	removeStoppableRequest: (id) => {
		set({
			stoppableRequests: get().stoppableRequests.filter(
				(stoppableRequest) => stoppableRequest.id !== id
			)
		});
	},
	getAllStoppableRequestsByTags: (tags) => {
		return get().stoppableRequests.filter((stoppableRequest) =>
			arrayContainsAllPrimitives(stoppableRequest.tags, tags)
		);
	},
	reset: () => {
		set(getInitialState());
	}
}));
