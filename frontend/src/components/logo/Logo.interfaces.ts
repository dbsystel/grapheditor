import { MouseEvent } from 'react';
import { GlobalComponentProps } from 'src/types/components';

export type LogoProps = GlobalComponentProps & {
	alt?: string;
	title?: string;
	onClick?: (event: MouseEvent<HTMLImageElement>) => void;
};
