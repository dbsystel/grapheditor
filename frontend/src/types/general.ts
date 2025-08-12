export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type Overwrite<T, NewT> = Omit<T, keyof NewT> & NewT;
export type RequireAtLeastOne<T> = {
	[K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];
