export type LoadingRequest = {
	id: string;
	progress: number; // in %, 0-100, fake value (not representing real request loading state)
};
