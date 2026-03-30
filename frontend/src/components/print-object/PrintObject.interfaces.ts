import { GlobalComponentProps } from 'src/types/components';

export type PrintObjectProps = GlobalComponentProps & {
	object: Record<string, unknown>;
};
