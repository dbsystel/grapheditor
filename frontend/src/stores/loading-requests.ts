import { LoadingRequest } from 'src/models/loading-request';
import { clone } from 'src/utils/helpers/general';
import { create } from 'zustand';

type LoadingRequestsStore = {
	loadingRequests: Array<LoadingRequest>;
	startLoadingRequest: (loadingRequestId: string, progress?: number) => void;
	updateLoadingRequest: (loadingRequestId: string, progress: number) => void;
	finishLoadingRequest: (loadingRequestId: string) => void;
	clearFinishedLoadingRequests: () => void;
	reset: () => void;
};

type InitialState = Pick<LoadingRequestsStore, 'loadingRequests'>;

const getInitialState: () => InitialState = () => {
	return {
		loadingRequests: []
	};
};

/**
 * Loading requests store.
 */
export const useLoadingRequestsStore = create<LoadingRequestsStore>((set, get) => ({
	...getInitialState(),
	startLoadingRequest: (loadingRequestId, progress = 50) => {
		const loadingActionsClone = clone(get().loadingRequests);

		loadingActionsClone.push({
			id: loadingRequestId,
			progress: progress
		});

		set({
			loadingRequests: loadingActionsClone
		});
	},
	updateLoadingRequest: (loadingRequestId, progress) => {
		const loadingActionsClone = get().loadingRequests.map((loadingAction) => {
			const loadingActionClone = clone(loadingAction);

			if (loadingAction.id === loadingRequestId) {
				loadingActionClone.progress = progress;
			}

			return loadingActionClone;
		});

		set({
			loadingRequests: loadingActionsClone
		});
	},
	finishLoadingRequest: (loadingRequestId) => {
		const loadingActionsClone = get().loadingRequests.map((loadingAction) => {
			const loadingActionClone = clone(loadingAction);

			if (loadingRequestId === loadingActionClone.id) {
				loadingActionClone.progress = 100;
			}

			return loadingActionClone;
		});

		set({
			loadingRequests: loadingActionsClone
		});
	},
	clearFinishedLoadingRequests: () => {
		const loadingActionsClone = get().loadingRequests.filter((loadingAction) => {
			return loadingAction.progress !== 100;
		});

		set({
			loadingRequests: loadingActionsClone
		});
	},
	reset: () => {
		set(getInitialState());
	}
}));
