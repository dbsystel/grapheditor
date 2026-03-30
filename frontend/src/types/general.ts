export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type Overwrite<T, Override> = Omit<T, keyof Override> & Override;
export type RequireAtLeastOne<T> = {
	[K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];
export type StringifyObject<T> = {
	[K in keyof T]: string;
};
// Require exactly one of the given Keys in T (default: all keys of T)
export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Omit<T, Keys> &
	{
		[K in Keys]: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, never>>;
	}[Keys];
