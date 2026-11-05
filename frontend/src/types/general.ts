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
// remove "null" from a single property
export type NonNullableProperty<T, K extends keyof T> = Omit<T, K> & {
	[P in K]-?: NonNullable<T[P]>;
};

// remove "null" from all properties
export type NonNullableProperties<T> = {
	[P in keyof T]-?: NonNullable<T[P]>;
};
type Rename<T, Old extends keyof T, New extends string> = Omit<T, Old> & { [K in New]: T[Old] };
export type Primitive = string | number | boolean | bigint | symbol | null | undefined;
