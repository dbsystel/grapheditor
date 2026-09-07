export type StoppableRequest = {
	id: StoppableRequestId;
	tags: Array<StoppableRequestTag>;
	abortController: AbortController;
	shouldRenderNotificationOnSuccess?: boolean;
};

export type StoppableRequestId = string;
export type StoppableRequestTag = 'global-search' | 'homepage-graph';
