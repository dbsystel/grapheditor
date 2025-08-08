import { DBTooltipProps } from '@db-ux/react-core-components/dist/components/tooltip/model';
import { GlobalComponentProps } from 'src/types/components';

export type TooltipProps = GlobalComponentProps &
	Omit<DBTooltipProps, 'content'> & {
		isOpen?: boolean;
		tooltipTargetRef: HTMLElement | null;
		offset?: number;
	};
