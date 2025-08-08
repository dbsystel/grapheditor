export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type Overwrite<T, NewT> = Omit<T, keyof NewT> & NewT;
